import {Pool} from "undici";
import * as txml from "txml";
import {HttpRequest, Signer, SignerOptions} from "@fgiova/aws-signature";
import {MessageAttributeValue, PublishBatchMessage, PublishBatchResponse, PublishMessage, SNSActions} from "./schemas";

export class MiniSNSClient {
	private readonly topicSettings: {
		region: string,
		accountId: string,
		topicName: string,
		host: string,
		endpoint: string
	};
	private readonly pool: Pool;
	private readonly undiciOptions: Pool.Options;
	private readonly signer: Signer;

	constructor (topicARN: string, endpoint?: string, undiciOptions?: Pool.Options, signer?: Signer | SignerOptions) {
		this.undiciOptions = undiciOptions;
		this.topicSettings = this.getTopicARN(topicARN, endpoint);
		this.pool = new Pool(this.topicSettings.endpoint, this.undiciOptions);
		if (signer instanceof Signer) {
			this.signer = signer;
		}
		else if (signer) {
			this.signer = new Signer(signer);
		}
		else {
			this.signer = new Signer();
		}
	}

	private getTopicARN (topicARN: string, endpoint?: string) {
		const [topicName, accountId, region] = topicARN.split(":").reverse();
		endpoint = endpoint ?? `https://sns.${region}.amazonaws.com`;
		const url = new URL(endpoint);
		return {
			region,
			accountId,
			topicName,
			host: url.host,
			endpoint
		}
	}

	async destroy () {
		return Promise.all([
			this.pool.destroy(),
			this.signer.destroy()
		]);
	}

	private attributeMap (attributes: Record<string, MessageAttributeValue>, payload: Record<string, any>) {
		let counter = 1;
		for (const [key, value] of Object.entries(attributes)) {
			if(!value.DataType) continue;
			payload[`MessageAttributes.entry.${counter}.Name`] = key;
			payload[`MessageAttributes.entry.${counter}.Value.DataType`] = value.DataType;
			if (value.DataType === "Binary" && value.BinaryValue) {
				payload[`MessageAttributes.entry.${counter}.Value.BinaryValue`] = Buffer.from(value.BinaryValue as unknown as string).toString("base64");
			}
			else if (value.DataType === "String" && value.StringValue) {
				payload[`MessageAttributes.entry.${counter}.Value.StringValue`] = value.StringValue;
			}
			counter++;
		}

	}

	private extendedEncodeURIComponent(str: string): string {
		return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
			return "%" + c.charCodeAt(0).toString(16).toUpperCase();
		});
	}

	private encodeBody ( payload: Record<string, any>) {
		const entries: string[] = [];
		payload.Version="2010-03-31";
		for (const [key, value] of Object.entries(payload)) {
			entries.push(`${this.extendedEncodeURIComponent(key)}=${this.extendedEncodeURIComponent(value)}`);
		}
		return entries.join("&");
	}

	private parseResponse (response: string) {
		return txml.simplify(txml.parse(response));
	}

	private async SNSRequest<B,R>(body: B, action: SNSActions) {
		const {region, accountId, topicName, host} = this.topicSettings;
		const requestBody = this.encodeBody({
			...body,
			Action: action
		});
		const requestData: HttpRequest = await this.signer.request({
			method: "POST",
			path: "/",
			headers: {
				"Host": host,
			},
			body: requestBody
		}, "sqs", region);

		const response = await this.pool.request({
			path: "/",
			method: requestData.method,
			headers: {
				"Content-Type": "www-form-urlencoded",
				"Content-length": Buffer.byteLength(requestBody).toString(),
				...requestData.headers
			},
			body: requestBody
		});
		if(response.statusCode !== 200){
			let message = await response.body.text();
			try {
				const parsedBody = this.parseResponse(message);
				if(parsedBody.message){
					message = parsedBody.message;
				}
			}
			catch (e) {
				// do nothing
			}
			throw Error(message);
		}
		return this.parseResponse(await response.body.text()) as R;
	}

	async publishMessage (payload: PublishMessage) {
		if (payload.MessageAttributes) {
			this.attributeMap(payload.MessageAttributes, payload);
			delete payload.MessageAttributes;
		}
		return this.SNSRequest<PublishMessage, {PublishResponse: {MessageId: string}}>(payload, "Publish");
	}

	async publishMessageBatch (payload: PublishBatchMessage) {
		const entries: Record<string, any> = {};
		const messages: Record<string, any>[] = [];
		for (const message of payload.PublishBatchRequestEntries) {
			if (message.MessageAttributes) {
				this.attributeMap(message.MessageAttributes, message);
				delete message.MessageAttributes;
			}
			messages.push(message);
		}
		let member = 0;
		for (const message of messages) {
			for (const [key, value] of Object.entries(message)) {
				entries[`PublishBatchRequestEntries.member.${member}.${key}`] = value;
				delete entries[key];
			}
			member++;
		}
		return this.SNSRequest<Record<string, any>, PublishBatchResponse>({
			...entries,
			TopicArn: payload.TopicArn,
		}, "PublishBatch");
	}



}