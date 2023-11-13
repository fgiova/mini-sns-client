# mini sns client using undici

[![NPM version](https://img.shields.io/npm/v/@fgiova/mini-sns-client.svg?style=flat)](https://www.npmjs.com/package/@fgiova/mini-sns-client)
![CI workflow](https://github.com/fgiova/mini-sns-client/actions/workflows/node.js.yml/badge.svg)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

## Description
This module allows minimal set of SNS service functions using "undici" as http agent.<br />
The @fgiova/aws-signature module is used for signing requests to optimize performance. <br />

Are supported:
- publish messages

## Installation
```bash
npm install @fgiova/mini-sns-client
```
## Usage

```typescript
import {MiniSNSClient} from '@fgiova/mini-sns-client'
import console = require("console");

const client = new MiniSNSClient("eu-central-1");

await client.publishMessage({
	TopicArn: "arn:aws:sns:eu-central-1:000000000000:test",
	Message:  "Hello World!",
	MessageAttributes: {
		"my-attribute": {
			DataType: "String",
			StringValue: "my-value"
		}
	}
});

await client.publishMessageBatch({
	TopicArn: "arn:aws:sns:eu-central-1:000000000000:test",
	PublishBatchRequestEntries: [
		{
            Id: "31afb534-e25e-5812-a92f-e8ff0921f9dd",
			Message:  "Hello World!",
			MessageAttributes: {
				"my-attribute": {
					DataType: "String",
					StringValue: "my-value"
				}
			}
        },
		{
			Id: "85565b18-6ad4-5ba5-89b2-06d381ab1a6a",
			Message:  "Hello World! Again",
		}
    ]
	
});


```

## API

```typescript
MiniSNSClient(region: string, endpoint?: string, undiciOptions?: Pool.Options, signer?: Signer | SignerOptions)
MiniSNSClient.publishMessage(message: PublishMessage): Promise<PublishMessageResult>
MiniSNSClient.publishMessageBatch(message: PublishBatchMessage): Promise<PublishMessageBatchResult>
```

All types are defined in [schemas.ts](./src/schemas.ts) and are derived from the [AWS SNS API](https://docs.aws.amazon.com/sns/latest/api/API_Operations.html)

## License
Licensed under [MIT](./LICENSE).
