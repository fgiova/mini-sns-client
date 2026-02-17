import { randomUUID } from "node:crypto";
import {
	type HttpRequest,
	Signer,
	type SignerOptions,
} from "@fgiova/aws-signature";
import * as txml from "txml";
import { Pool } from "undici";
import type {
	MessageAttributeValue,
	PublishBatchMessage,
	PublishBatchRequestEntry,
	PublishBatchResponse,
	PublishMessage,
	PublishResponse,
	SNSActions,
} from "./schemas";

export class MiniSNSClient {
	private readonly topicSettings: {
		region: string;
		host: string;
		endpoint: string;
	};
	private readonly pool: Pool;
	private readonly undiciOptions?: Pool.Options;
	private readonly signer: Signer;

	constructor(
		region: string,
		endpoint?: string,
		undiciOptions?: Pool.Options,
		signer?: Signer | SignerOptions,
	) {
		this.undiciOptions = undiciOptions;
		endpoint = endpoint ?? `https://sns.${region}.amazonaws.com`;
		const url = new URL(endpoint);
		this.topicSettings = {
			region,
			host: url.host,
			endpoint,
		};
		this.pool = new Pool(this.topicSettings.endpoint, this.undiciOptions);
		if (signer instanceof Signer) {
			this.signer = signer;
		} else if (signer) {
			this.signer = new Signer(signer);
		} else {
			this.signer = new Signer();
		}
	}

	async destroy(signer = true) {
		return Promise.all([
			this.pool.destroy(),
			(signer && this.signer.destroy()) || true,
		]);
	}

	private attributeMap(
		attributes: Record<string, MessageAttributeValue>,
		payload: Record<string, unknown>,
	) {
		let counter = 1;
		for (const [key, value] of Object.entries(attributes)) {
			/* c8 ignore next 1 */
			if (!value.DataType) continue;
			payload[`MessageAttributes.entry.${counter}.Name`] = key;
			payload[`MessageAttributes.entry.${counter}.Value.DataType`] =
				value.DataType;
			if (value.DataType === "Binary" && value.BinaryValue) {
				payload[`MessageAttributes.entry.${counter}.Value.BinaryValue`] =
					Buffer.from(value.BinaryValue as unknown as string).toString(
						"base64",
					);
			} else if (
				["String", "Number", "String.Array"].includes(value.DataType) &&
				value.StringValue
			) {
				payload[`MessageAttributes.entry.${counter}.Value.StringValue`] =
					`${value.StringValue}`;
			}
			counter++;
		}
	}

	private extendedEncodeURIComponent(str: string): string {
		return encodeURIComponent(str).replace(
			/[!'()*]/g,
			(c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
		);
	}

	private encodeBody(payload: Record<string, unknown>) {
		const entries: string[] = [];
		payload.Version = "2010-03-31";
		for (const [key, value] of Object.entries(payload)) {
			entries.push(
				`${this.extendedEncodeURIComponent(key)}=${this.extendedEncodeURIComponent(value as string)}`,
			);
		}
		return entries.join("&");
	}

	private parseResponse(response: string) {
		return txml.simplify(txml.parse(response)) as Record<string, unknown>;
	}

	private parseBatchResponseResult(response: unknown) {
		if (!response) return undefined;
		if (typeof response === "object" && "member" in response) {
			if (Array.isArray(response.member)) {
				return response.member;
			} else {
				return [response.member];
			}
		}

		return undefined;
	}

	private async SNSRequest<B, R>(body: B, action: SNSActions) {
		const { region, host } = this.topicSettings;
		const requestBody = this.encodeBody({
			...body,
			Action: action,
		});
		const requestData: HttpRequest = await this.signer.request(
			{
				method: "POST",
				path: "/",
				headers: {
					Host: host,
				},
				body: requestBody,
			},
			"sns",
			region,
		);

		const response = await this.pool.request({
			path: "/",
			method: requestData.method as "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				"Content-length": Buffer.byteLength(requestBody).toString(),
				...requestData.headers,
			},
			body: requestBody,
		});

		if (response.statusCode !== 200) {
			let message = await response.body.text();
			try {
				const parsedBody = this.parseResponse(message);
				if (
					parsedBody.ErrorResponse &&
					typeof parsedBody.ErrorResponse === "object" &&
					"Error" in parsedBody.ErrorResponse &&
					parsedBody.ErrorResponse.Error &&
					typeof parsedBody.ErrorResponse.Error === "object" &&
					"Message" in parsedBody.ErrorResponse.Error &&
					parsedBody.ErrorResponse?.Error?.Message
				) {
					message = parsedBody.ErrorResponse.Error.Message as string;
				}
			} /* c8 ignore next 3 */ catch (_e) {
				// do nothing
			}
			throw Error(message);
		}
		return this.parseResponse(await response.body.text()) as R;
	}

	async publishMessage(payload: PublishMessage) {
		if (payload.MessageAttributes) {
			this.attributeMap(
				payload.MessageAttributes,
				payload as unknown as Record<string, unknown>,
			);
			delete payload.MessageAttributes;
		}
		const result = await this.SNSRequest<
			PublishMessage,
			{
				PublishResponse: {
					PublishResult: { MessageId: string; SequenceNumber?: string };
				};
			}
		>(payload, "Publish");
		return {
			MessageId: result.PublishResponse.PublishResult.MessageId,
			SequenceNumber: result.PublishResponse.PublishResult.SequenceNumber,
		} as PublishResponse;
	}

	private splitArrayMessages(messages: PublishBatchRequestEntry[]) {
		return messages.reduce((resultArray, item, index) => {
			const chunkIndex = Math.floor(index / 10);
			/* c8 ignore next */
			if (!item.Id) item.Id = randomUUID();
			if (!resultArray[chunkIndex]) {
				resultArray[chunkIndex] = []; // start a new chunk
			}
			resultArray[chunkIndex].push(item);

			return resultArray;
		}, [] as PublishBatchRequestEntry[][]);
	}
	private async publishSingleMessageBatch(payload: PublishBatchMessage) {
		const entries: Record<string, unknown> = {};
		const messages: PublishBatchRequestEntry[] = [];
		/* c8 ignore next 1 */
		const incomingMessages = payload.PublishBatchRequestEntries || [];

		for (const message of incomingMessages) {
			if (message.MessageAttributes) {
				this.attributeMap(
					message.MessageAttributes,
					message as unknown as Record<string, unknown>,
				);
				delete message.MessageAttributes;
			}
			messages.push(message);
		}
		let member = 1;
		for (const message of messages) {
			for (const [key, value] of Object.entries(message)) {
				entries[`PublishBatchRequestEntries.member.${member}.${key}`] = value;
				delete entries[key];
			}
			member++;
		}

		const result = await this.SNSRequest<
			Record<string, unknown>,
			{
				PublishBatchResponse: {
					PublishBatchResult: PublishBatchResponse;
				};
			}
		>(
			{
				...entries,
				TopicArn: payload.TopicArn,
			},
			"PublishBatch",
		);

		return {
			Successful: this.parseBatchResponseResult(
				result.PublishBatchResponse.PublishBatchResult.Successful,
			),
			Failed: this.parseBatchResponseResult(
				result.PublishBatchResponse.PublishBatchResult.Failed,
			),
		} as PublishBatchResponse;
	}

	async publishMessageBatch(payload: PublishBatchMessage) {
		/* c8 ignore next 1 */
		const messages = payload.PublishBatchRequestEntries || [];
		const messagesChunks = this.splitArrayMessages(messages);
		const responses = {} as PublishBatchResponse;

		for (const messagesChunk of messagesChunks) {
			const responseChunk = await this.publishSingleMessageBatch({
				TopicArn: payload.TopicArn,
				PublishBatchRequestEntries: messagesChunk,
			});
			if (responseChunk.Failed) {
				if (!responses.Failed) responses.Failed = [];
				responses.Failed.push(...responseChunk.Failed);
			}
			if (responseChunk.Successful) {
				if (!responses.Successful) responses.Successful = [];
				responses.Successful.push(...responseChunk.Successful);
			}
		}
		return responses;
	}
}
export type * from "./schemas";
