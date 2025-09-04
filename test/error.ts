import { randomUUID } from "node:crypto";
import { test } from "tap";
import { MockAgent, setGlobalDispatcher } from "undici";
import { MiniSNSClient } from "../src";

process.env.AWS_ACCESS_KEY_ID = "foo";
process.env.AWS_SECRET_ACCESS_KEY = "bar";

const topicARN = "arn:aws:sns:eu-central-1:000000000000:test";

test("MiniSNSClient Errors", { only: true }, async (t) => {
	t.beforeEach(async (t) => {
		const mockAgent = new MockAgent();
		setGlobalDispatcher(mockAgent);
		mockAgent.disableNetConnect();
		const mockPool = mockAgent.get("https://sns.eu-central-1.amazonaws.com");
		const client = new MiniSNSClient("eu-central-1", undefined, {
			factory: () => mockPool,
		});
		t.context = {
			mockPool,
			mockAgent,
			client,
		};
	});
	t.afterEach(async (t) => {
		try {
			await t.context.mockPool.close();
			await t.context.mockAgent.close();
		} catch {
			// ignore
		}
	});

	await t.test("publishMessage GeneralError", async (t) => {
		const { mockPool, client } = t.context;
		const message = {
			Message: "Hello World!",
			TopicArn: topicARN,
		};
		mockPool
			.intercept({
				path: "/",
				method: "POST",
				body: `Message=Hello%20World%21&TopicArn=${encodeURIComponent(topicARN)}&Action=Publish&Version=2010-03-31`,
			})
			.reply(500, "Generic Error");
		await t.rejects(client.publishMessage(message), "Generic Error");
	});

	await t.test("publishMessage Structured Error", async (t) => {
		const { mockPool, client } = t.context;
		const message = {
			Message: "Hello World!",
			TopicArn: topicARN,
		};
		mockPool
			.intercept({
				path: "/",
				method: "POST",
				body: `Message=Hello%20World%21&TopicArn=${encodeURIComponent(topicARN)}&Action=Publish&Version=2010-03-31`,
			})
			.reply(
				500,
				`<ErrorResponse xmlns="http://sns.amazonaws.com/doc/2010-03-31/">
  <Error>
    <Type>Sender</Type>
    <Code>NotFound</Code>
    <Message>Topic does not exist</Message>
  </Error>
  <RequestId>${randomUUID()}</RequestId>
</ErrorResponse>
`,
			);
		await t.rejects(client.publishMessage(message), "Topic does not exist");
	});
});
