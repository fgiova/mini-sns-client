import { test } from "tap";
import {MiniSNSClient, PublishBatchMessage, PublishMessage} from "../src";
import {setGlobalDispatcher, MockAgent} from "undici";
import {randomUUID} from "crypto";
import {Signer} from "@fgiova/aws-signature";
process.env.AWS_ACCESS_KEY_ID = "foo";
process.env.AWS_SECRET_ACCESS_KEY = "bar";

const topicARN = "arn:aws:sns:eu-central-1:000000000000:test";


test("MiniSNSClient", { only: true }, async (t) => {

	t.beforeEach(async (t) => {
		const mockAgent = new MockAgent();
		setGlobalDispatcher(mockAgent);
		mockAgent.disableNetConnect();
		const mockPool = mockAgent.get("https://sns.eu-central-1.amazonaws.com");
		const client = new MiniSNSClient("eu-central-1", undefined, {
			factory: () => mockPool
		});
		t.context = {
			mockPool,
			mockAgent,
			client
		}
	});
	t.afterEach(async (t) => {
		try{
			await t.context.mockPool.close();
			await t.context.mockAgent.close();
		} catch {
			// ignore
		}
	});

	await t.test("publishMessage", async (t) => {
		const { mockPool, client }  = t.context;
		const MessageId = randomUUID();
		const message = {
			Message: "Hello World!",
			TopicArn: topicARN
		} as PublishMessage
		mockPool.intercept({
			path: "/",
			method: "POST",
			body: `Message=Hello%20World%21&TopicArn=${encodeURIComponent(topicARN)}&Action=Publish&Version=2010-03-31`
		}).reply(200, `<PublishResponse xmlns="https://sns.amazonaws.com/doc/2010-03-31/">
    <PublishResult>
        <MessageId>${MessageId}</MessageId>
    </PublishResult>
    <ResponseMetadata>
        <RequestId>${randomUUID()}</RequestId>
    </ResponseMetadata>
</PublishResponse> `);
		const result = await client.publishMessage(message);
		t.same(result.MessageId, MessageId);
	});
	await t.test("publishMessage string Attribute", async (t) => {
		const { mockPool, client }  = t.context;
		const MessageId = randomUUID();
		const message = {
			Message: "Hello World!",
			TopicArn: topicARN,
			MessageAttributes: {
				"test": {
					DataType: "String",
					StringValue: "test"
				}
			}
		} as PublishMessage;
		mockPool.intercept({
			path: "/",
			method: "POST",
			body: `Message=Hello%20World%21&TopicArn=${encodeURIComponent(topicARN)}&MessageAttributes.entry.1.Name=test&MessageAttributes.entry.1.Value.DataType=String&MessageAttributes.entry.1.Value.StringValue=test&Action=Publish&Version=2010-03-31`
		}).reply(200, `<PublishResponse xmlns="https://sns.amazonaws.com/doc/2010-03-31/">
    <PublishResult>
        <MessageId>${MessageId}</MessageId>
    </PublishResult>
    <ResponseMetadata>
        <RequestId>${randomUUID()}</RequestId>
    </ResponseMetadata>
</PublishResponse> `);
		const result = await client.publishMessage(message);
		t.same(result.MessageId, MessageId);
	});
	await t.test("publishMessage binary Attribute", async (t) => {
		const { mockPool, client }  = t.context;
		const MessageId = randomUUID();
		const message = {
			Message: "Hello World!",
			TopicArn: topicARN,
			MessageAttributes: {
				"test": {
					DataType: "Binary",
					BinaryValue: new Uint8Array([0xde, 0xad, 0xbe, 0xef])
				}
			}
		} as PublishMessage;
		mockPool.intercept({
			path: "/",
			method: "POST",
			body: `Message=Hello%20World%21&TopicArn=${encodeURIComponent(topicARN)}&MessageAttributes.entry.1.Name=test&MessageAttributes.entry.1.Value.DataType=Binary&MessageAttributes.entry.1.Value.BinaryValue=3q2%2B7w%3D%3D&Action=Publish&Version=2010-03-31`
		}).reply(200, `<PublishResponse xmlns="https://sns.amazonaws.com/doc/2010-03-31/">
    <PublishResult>
        <MessageId>${MessageId}</MessageId>
    </PublishResult>
    <ResponseMetadata>
        <RequestId>${randomUUID()}</RequestId>
    </ResponseMetadata>
</PublishResponse> `);
		const result = await client.publishMessage(message);
		t.same(result.MessageId, MessageId);
	});
	await t.test("publishMessage Using signer instance", async (t) => {
		const { mockPool }  = t.context;
		const signer = new Signer();
		const client = new MiniSNSClient("eu-central-1", undefined, {
			factory: () => mockPool
		}, signer);
		const MessageId = randomUUID();
		const message = {
			Message: "Hello World!",
			TopicArn: topicARN
		} as PublishMessage
		mockPool.intercept({
			path: "/",
			method: "POST",
			body: `Message=Hello%20World%21&TopicArn=${encodeURIComponent(topicARN)}&Action=Publish&Version=2010-03-31`
		}).reply(200, `<PublishResponse xmlns="https://sns.amazonaws.com/doc/2010-03-31/">
    <PublishResult>
        <MessageId>${MessageId}</MessageId>
    </PublishResult>
    <ResponseMetadata>
        <RequestId>${randomUUID()}</RequestId>
    </ResponseMetadata>
</PublishResponse> `);
		const result = await client.publishMessage(message);
		t.same(result.MessageId, MessageId);
		await t.resolves(client.destroy(false));
		await t.resolves(signer.destroy());
	});
	await t.test("publishMessage Using signer options", async (t) => {
		const { mockPool }  = t.context;
		const client = new MiniSNSClient("eu-central-1", undefined, {
			factory: () => mockPool
		}, {minThreads: 1, maxThreads: 1});
		t.teardown(async () => {
			await client.destroy();
		});
		const MessageId = randomUUID();
		const message = {
			Message: "Hello World!",
			TopicArn: topicARN
		} as PublishMessage
		mockPool.intercept({
			path: "/",
			method: "POST",
			body: `Message=Hello%20World%21&TopicArn=${encodeURIComponent(topicARN)}&Action=Publish&Version=2010-03-31`
		}).reply(200, `<PublishResponse xmlns="https://sns.amazonaws.com/doc/2010-03-31/">
    <PublishResult>
        <MessageId>${MessageId}</MessageId>
    </PublishResult>
    <ResponseMetadata>
        <RequestId>${randomUUID()}</RequestId>
    </ResponseMetadata>
</PublishResponse> `);
		const result = await client.publishMessage(message);
		t.same(result.MessageId, MessageId);
	});
	await t.test("publishMessage and destroy client", async (t) => {
		const { mockPool, client }  = t.context;
		const MessageId = randomUUID();
		const message = {
			Message: "Hello World!",
			TopicArn: topicARN
		};
		mockPool.intercept({
			path: "/",
			method: "POST",
			body: `Message=Hello%20World%21&TopicArn=${encodeURIComponent(topicARN)}&Action=Publish&Version=2010-03-31`
		}).reply(200, `<PublishResponse xmlns="https://sns.amazonaws.com/doc/2010-03-31/">
    <PublishResult>
        <MessageId>${MessageId}</MessageId>
    </PublishResult>
    <ResponseMetadata>
        <RequestId>${randomUUID()}</RequestId>
    </ResponseMetadata>
</PublishResponse> `);
		const result = await client.publishMessage(message);
		t.same(result.MessageId, MessageId);
		await t.resolves(client.destroy());
	});

	await t.test("publishMessage batch single item", async (t) => {
		const { mockPool, client }  = t.context;
		const messagBatch = {
			PublishBatchRequestEntries: [ {
				Id: randomUUID(),
				Message: "Hello World!",
			} ],
			TopicArn: topicARN
		} as PublishBatchMessage;
		mockPool.intercept({
			path: "/",
			method: "POST",
			body: `PublishBatchRequestEntries.member.1.Id=${messagBatch.PublishBatchRequestEntries[0].Id}&PublishBatchRequestEntries.member.1.Message=Hello%20World%21&TopicArn=arn%3Aaws%3Asns%3Aeu-central-1%3A000000000000%3Atest&Action=PublishBatch&Version=2010-03-31`
		}).reply(200, `<PublishBatchResponse xmlns="http://sns.amazonaws.com/doc/2010-03-31/">
  <PublishBatchResult>
    <Failed/>
    <Successful>
      <member>
        <MessageId>${randomUUID()}</MessageId>
        <Id>${messagBatch.PublishBatchRequestEntries[0].Id}</Id>
      </member>
    </Successful>
  </PublishBatchResult>
  <ResponseMetadata>
    <RequestId>93313591-271d-50b4-a0ca-685d2fb07219</RequestId>
  </ResponseMetadata>
</PublishBatchResponse>`);
		const result = await client.publishMessageBatch(messagBatch);
		t.same(result.Successful[0].Id, messagBatch.PublishBatchRequestEntries[0].Id);
	});
	await t.test("publishMessage batch multiple item", async (t) => {
		const { mockPool, client }  = t.context;
		const messagBatch = {
			PublishBatchRequestEntries: [ {
				Id: randomUUID(),
				Message: "Hello World!",
			},
				{
					Id: randomUUID(),
					Message: "Hello World!",
				}],
			TopicArn: topicARN
		} as PublishBatchMessage;
		mockPool.intercept({
			path: "/",
			method: "POST",
			body: `PublishBatchRequestEntries.member.1.Id=${messagBatch.PublishBatchRequestEntries[0].Id}&PublishBatchRequestEntries.member.1.Message=Hello%20World%21&PublishBatchRequestEntries.member.2.Id=${messagBatch.PublishBatchRequestEntries[1].Id}&PublishBatchRequestEntries.member.2.Message=Hello%20World%21&TopicArn=arn%3Aaws%3Asns%3Aeu-central-1%3A000000000000%3Atest&Action=PublishBatch&Version=2010-03-31`
		}).reply(200, `<PublishBatchResponse xmlns="http://sns.amazonaws.com/doc/2010-03-31/">
  <PublishBatchResult>
    <Failed/>
    <Successful>
      <member>
        <MessageId>${randomUUID()}</MessageId>
        <Id>${messagBatch.PublishBatchRequestEntries[0].Id}</Id>
      </member>
      <member>
        <MessageId>${randomUUID()}</MessageId>
        <Id>${messagBatch.PublishBatchRequestEntries[1].Id}</Id>
      </member>
    </Successful>
  </PublishBatchResult>
  <ResponseMetadata>
    <RequestId>93313591-271d-50b4-a0ca-685d2fb07219</RequestId>
  </ResponseMetadata>
</PublishBatchResponse>`);
		const result = await client.publishMessageBatch(messagBatch);
		t.same(result.Successful[0].Id, messagBatch.PublishBatchRequestEntries[0].Id);
		t.same(result.Successful[1].Id, messagBatch.PublishBatchRequestEntries[1].Id);
	});
	await t.test("publishMessage batch multiple item > 10", async (t) => {
		const { mockPool, client }  = t.context;
		function splitArray<T>(items: T[], maxItems = 10): T[][]{
			return items.reduce((resultArray, item, index) => {
				const chunkIndex = Math.floor(index/10);
				if(!resultArray[chunkIndex]) {
					resultArray[chunkIndex] = []; // start a new chunk
				}
				resultArray[chunkIndex].push(item);

				return resultArray;
			}, []);
		}

		const messages: PublishBatchMessage["PublishBatchRequestEntries"] = [];
		const mockResponses: {MessageId: string, Id:string}[] = [];
		for(let i = 0; i < 15; i++){
			const message: PublishBatchMessage["PublishBatchRequestEntries"][0] = {
				Id: randomUUID(),
				Message: `Hello World ${i}!`
			}
			messages.push(message);
			mockResponses.push({
				Id: message.Id,
				MessageId: randomUUID()
			})
		}

		const responsesChunks = splitArray(mockResponses);

		mockPool.intercept({
			path: "/",
			method: "POST",
			body: (body: string) => {
				const entries = body.split("&").filter(item => {
					return item.match(/^PublishBatchRequestEntries\.member\.\d+\.Id=/);
				});
				const entriesIds = entries.map(item => item.split("=")[1]);
				const entriesIdsSorted = entriesIds.sort();
				const messagesChunksIdsSorted = responsesChunks[0].map(item => item.Id).sort();
				return JSON.stringify(entriesIdsSorted) === JSON.stringify(messagesChunksIdsSorted);
			}
		}).reply(200, `<PublishBatchResponse xmlns="http://sns.amazonaws.com/doc/2010-03-31/">
  <PublishBatchResult>
    <Failed/>
    <Successful>${responsesChunks[0].map((chunk, index) => 
      `<member>
        <MessageId>${randomUUID()}</MessageId>
        <Id>${chunk.Id}</Id>
      </member>`)
	}
    </Successful>
  </PublishBatchResult>
  <ResponseMetadata>
    <RequestId>${randomUUID()}</RequestId>
  </ResponseMetadata>
</PublishBatchResponse>`);
		mockPool.intercept({
			path: "/",
			method: "POST",
			body: (body: string) => {
				const entries = body.split("&").filter(item => {
					return item.match(/^PublishBatchRequestEntries\.member\.\d+\.Id=/);
				});
				const entriesIds = entries.map(item => item.split("=")[1]);
				const entriesIdsSorted = entriesIds.sort();
				const messagesChunksIdsSorted = responsesChunks[1].map(item => item.Id).sort();
				return JSON.stringify(entriesIdsSorted) === JSON.stringify(messagesChunksIdsSorted);
			}
		}).reply(200, `<PublishBatchResponse xmlns="http://sns.amazonaws.com/doc/2010-03-31/">
  <PublishBatchResult>
    <Failed/>
    <Successful>${responsesChunks[1].map((chunk, index) =>
			`<member>
        <MessageId>${randomUUID()}</MessageId>
        <Id>${chunk.Id}</Id>
      </member>`)
		}
    </Successful>
  </PublishBatchResult>
  <ResponseMetadata>
    <RequestId>${randomUUID()}</RequestId>
  </ResponseMetadata>
</PublishBatchResponse>`);
		const result = await client.publishMessageBatch({
			PublishBatchRequestEntries: messages,
			TopicArn: topicARN
		});
		t.same(result.Successful[0].Id, responsesChunks[0][0].Id);
		t.same(result.Successful[10].Id, responsesChunks[1][0].Id);
	});
	await t.test("publishMessage batch multiple item w a failed message", async (t) => {
		const { mockPool, client }  = t.context;
		const messagBatch = {
			PublishBatchRequestEntries: [ {
				Id: randomUUID(),
				Message: "Hello World!",
			},
				{
					Id: randomUUID(),
					Message: "Hello World!",
				}],
			TopicArn: topicARN
		} as PublishBatchMessage;
		mockPool.intercept({
			path: "/",
			method: "POST",
			body: `PublishBatchRequestEntries.member.1.Id=${messagBatch.PublishBatchRequestEntries[0].Id}&PublishBatchRequestEntries.member.1.Message=Hello%20World%21&PublishBatchRequestEntries.member.2.Id=${messagBatch.PublishBatchRequestEntries[1].Id}&PublishBatchRequestEntries.member.2.Message=Hello%20World%21&TopicArn=arn%3Aaws%3Asns%3Aeu-central-1%3A000000000000%3Atest&Action=PublishBatch&Version=2010-03-31`
		}).reply(200, `<PublishBatchResponse xmlns="http://sns.amazonaws.com/doc/2010-03-31/">
  <PublishBatchResult>
    <Successful>
      <member>
        <MessageId>${randomUUID()}</MessageId>
        <Id>${messagBatch.PublishBatchRequestEntries[0].Id}</Id>
      </member>
    </Successful>
    <Failed>
      <member>
        <MessageId>${randomUUID()}</MessageId>
        <Id>${messagBatch.PublishBatchRequestEntries[1].Id}</Id>
      </member>
	</Failed>
  </PublishBatchResult>
  <ResponseMetadata>
    <RequestId>93313591-271d-50b4-a0ca-685d2fb07219</RequestId>
  </ResponseMetadata>
</PublishBatchResponse>`);
		const result = await client.publishMessageBatch(messagBatch);
		t.same(result.Successful[0].Id, messagBatch.PublishBatchRequestEntries[0].Id);
		t.same(result.Failed[0].Id, messagBatch.PublishBatchRequestEntries[1].Id);
	});
	await t.test("publishMessage batch single item w string attribute", async (t) => {
		const { mockPool, client }  = t.context;
		const messagBatch = {
			PublishBatchRequestEntries: [ {
				Id: randomUUID(),
				Message: "Hello World!",
				MessageAttributes: {
					"test": {
						DataType: "String",
						StringValue: "test"
					}
				}
			} ],
			TopicArn: topicARN
		} as PublishBatchMessage;
		mockPool.intercept({
			path: "/",
			method: "POST",
			body: `PublishBatchRequestEntries.member.1.Id=${messagBatch.PublishBatchRequestEntries[0].Id}&PublishBatchRequestEntries.member.1.Message=Hello%20World%21&PublishBatchRequestEntries.member.1.MessageAttributes.entry.1.Name=test&PublishBatchRequestEntries.member.1.MessageAttributes.entry.1.Value.DataType=String&PublishBatchRequestEntries.member.1.MessageAttributes.entry.1.Value.StringValue=test&TopicArn=arn%3Aaws%3Asns%3Aeu-central-1%3A000000000000%3Atest&Action=PublishBatch&Version=2010-03-31`
		}).reply(200, `<PublishBatchResponse xmlns="http://sns.amazonaws.com/doc/2010-03-31/">
  <PublishBatchResult>
    <Failed/>
    <Successful>
      <member>
        <MessageId>${randomUUID()}</MessageId>
        <Id>${messagBatch.PublishBatchRequestEntries[0].Id}</Id>
      </member>
    </Successful>
  </PublishBatchResult>
  <ResponseMetadata>
    <RequestId>93313591-271d-50b4-a0ca-685d2fb07219</RequestId>
  </ResponseMetadata>
</PublishBatchResponse>`);
		const result = await client.publishMessageBatch(messagBatch);
		t.same(result.Successful[0].Id, messagBatch.PublishBatchRequestEntries[0].Id);
	});
});