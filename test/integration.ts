import { randomUUID } from "node:crypto";
import "./helpers/localtest";
import {
	DeleteMessageCommand,
	ReceiveMessageCommand,
	SQSClient,
} from "@aws-sdk/client-sqs";
import { test } from "tap";
import {
	MiniSNSClient,
	type PublishBatchMessage,
	type PublishBatchRequestEntry,
	type PublishMessage,
} from "../src";

const topicARN = "arn:aws:sns:eu-central-1:000000000000:test";

test("MiniSNSClient Integration", async (t) => {
	let client: MiniSNSClient;

	t.beforeEach(async () => {
		client = new MiniSNSClient("eu-central-1", process.env.LOCALSTACK_ENDPOINT);
	});
	t.afterEach(async () => {
		await client.destroy();
	});

	await t.test("publishMessage", async (t) => {
		const message = {
			Message: "Hello World!",
			TopicArn: topicARN,
		} as PublishMessage;
		const result = await client.publishMessage(message);
		t.type(result.MessageId, "string");
		t.ok(result.MessageId?.length);
	});

	await t.test("publishMessage with String Attribute", async (t) => {
		const message = {
			Message: "Hello World!",
			TopicArn: topicARN,
			MessageAttributes: {
				test: {
					DataType: "String",
					StringValue: "test-value",
				},
			},
		} as PublishMessage;
		const result = await client.publishMessage(message);
		t.type(result.MessageId, "string");
		t.ok(result.MessageId?.length);
	});

	await t.test("publishMessage with Binary Attribute", async (t) => {
		const message = {
			Message: "Hello World!",
			TopicArn: topicARN,
			MessageAttributes: {
				test: {
					DataType: "Binary",
					BinaryValue: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
				},
			},
		} as PublishMessage;
		const result = await client.publishMessage(message);
		t.type(result.MessageId, "string");
		t.ok(result.MessageId?.length);
	});

	await t.test("publishMessageBatch single item", async (t) => {
		const messageBatch = {
			PublishBatchRequestEntries: [
				{
					Id: randomUUID(),
					Message: "Hello World!",
				},
			],
			TopicArn: topicARN,
		} as PublishBatchMessage;
		const result = await client.publishMessageBatch(messageBatch);
		t.ok(result.Successful);
		t.equal(result.Successful?.length, 1);
		t.equal(
			result.Successful?.[0].Id,
			messageBatch.PublishBatchRequestEntries?.[0].Id,
		);
		t.type(result.Successful?.[0].MessageId, "string");
	});

	await t.test("publishMessageBatch multiple items", async (t) => {
		const messageBatch = {
			PublishBatchRequestEntries: [
				{
					Id: randomUUID(),
					Message: "Hello World 1!",
				},
				{
					Id: randomUUID(),
					Message: "Hello World 2!",
				},
			],
			TopicArn: topicARN,
		} as PublishBatchMessage;
		const result = await client.publishMessageBatch(messageBatch);
		t.ok(result.Successful);
		t.equal(result.Successful?.length, 2);
		t.type(result.Successful?.[0].MessageId, "string");
		t.type(result.Successful?.[1].MessageId, "string");
	});

	await t.test("publishMessageBatch > 10 items", async (t) => {
		const messages: PublishBatchMessage["PublishBatchRequestEntries"] = [];
		for (let i = 0; i < 15; i++) {
			const message: PublishBatchRequestEntry = {
				Id: randomUUID(),
				Message: `Hello World ${i}!`,
			};
			messages.push(message);
		}
		const result = await client.publishMessageBatch({
			PublishBatchRequestEntries: messages,
			TopicArn: topicARN,
		});
		t.ok(result.Successful);
		t.equal(result.Successful?.length, 15);
		for (const entry of result.Successful || []) {
			t.type(entry.MessageId, "string");
			t.ok(entry.MessageId?.length);
		}
	});

	await t.test("publishMessage on non-existent topic throws", async (t) => {
		const message = {
			Message: "Hello World!",
			TopicArn: "arn:aws:sns:eu-central-1:000000000000:non-existent-topic",
		} as PublishMessage;
		await t.rejects(client.publishMessage(message));
	});

	await t.test("publishMessage delivers to SQS subscriber", async (t) => {
		const sqs = new SQSClient({
			endpoint: process.env.LOCALSTACK_ENDPOINT,
			region: "eu-central-1",
		});

		// Drain any messages left by previous tests
		let drained = true;
		while (drained) {
			const old = await sqs.send(
				new ReceiveMessageCommand({
					QueueUrl: process.env.SQS_QUEUE_URL,
					WaitTimeSeconds: 0,
					MaxNumberOfMessages: 10,
				}),
			);
			if (!old.Messages || old.Messages.length === 0) {
				drained = false;
			} else {
				for (const msg of old.Messages) {
					await sqs.send(
						new DeleteMessageCommand({
							QueueUrl: process.env.SQS_QUEUE_URL,
							ReceiptHandle: msg.ReceiptHandle,
						}),
					);
				}
			}
		}

		const uniqueBody = `delivery-test-${randomUUID()}`;
		const message = {
			Message: uniqueBody,
			TopicArn: topicARN,
		} as PublishMessage;
		const publishResult = await client.publishMessage(message);
		t.type(publishResult.MessageId, "string");

		const receiveResult = await sqs.send(
			new ReceiveMessageCommand({
				QueueUrl: process.env.SQS_QUEUE_URL,
				WaitTimeSeconds: 5,
				MaxNumberOfMessages: 1,
			}),
		);

		t.ok(receiveResult.Messages, "should receive messages");
		t.equal(
			receiveResult.Messages?.length,
			1,
			"should receive exactly one message",
		);
		t.equal(
			receiveResult.Messages?.[0].Body,
			uniqueBody,
			"message body should match",
		);

		if (receiveResult.Messages?.[0].ReceiptHandle) {
			await sqs.send(
				new DeleteMessageCommand({
					QueueUrl: process.env.SQS_QUEUE_URL,
					ReceiptHandle: receiveResult.Messages[0].ReceiptHandle,
				}),
			);
		}

		sqs.destroy();
	});
});
