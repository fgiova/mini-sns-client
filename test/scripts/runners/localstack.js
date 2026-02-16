const {
	SNSClient,
	CreateTopicCommand,
	SubscribeCommand,
	SetSubscriptionAttributesCommand,
} = require("@aws-sdk/client-sns");
const {
	SQSClient,
	CreateQueueCommand,
	GetQueueAttributesCommand,
} = require("@aws-sdk/client-sqs");
const { GenericContainer, Wait } = require("testcontainers");

const startLocalStack = async () => {
	const localStack = await new GenericContainer("localstack/localstack:latest")
		.withLabels({
			"org.testcontainers.reaper-session-id": process.env.REAPER_SESSION_ID,
		})
		.withExposedPorts(4566)
		.withEnvironment({
			SERVICES: "sns,sqs",
			DEBUG: "1",
			DOCKER_HOST: "unix:///var/run/docker.sock",
			NODE_TLS_REJECT_UNAUTHORIZED: "0",
			HOSTNAME: "localhost",
			AWS_DEFAULT_REGION: "eu-central-1",
		})
		.withBindMounts([
			{
				source: "/var/run/docker.sock",
				target: "/var/run/docker.sock",
			},
		])
		.withWaitStrategy(Wait.forListeningPorts())
		.start();
	const port = localStack.getMappedPort(4566);
	const host = localStack.getHost();
	process.env.AWS_REGION = "eu-central-1";
	process.env.AWS_ACCESS_KEY_ID = "AWS_ACCESS_KEY_ID";
	process.env.AWS_SECRET_ACCESS_KEY = "AWS_SECRET_ACCESS_KEY";
	return {
		container: localStack,
		port,
		host,
	};
};

const bootstrap = async (host, port) => {
	const endpoint = `http://${host}:${port}`;

	console.log("Bootstrap SNS");
	const sns = new SNSClient({
		endpoint,
		region: "eu-central-1",
	});
	const { TopicArn: topicArn } = await sns.send(
		new CreateTopicCommand({
			Name: "test",
		}),
	);

	console.log("Bootstrap SQS");
	const sqs = new SQSClient({
		endpoint,
		region: "eu-central-1",
	});
	const { QueueUrl: queueUrl } = await sqs.send(
		new CreateQueueCommand({
			QueueName: "test-queue",
		}),
	);

	const { Attributes } = await sqs.send(
		new GetQueueAttributesCommand({
			QueueUrl: queueUrl,
			AttributeNames: ["QueueArn"],
		}),
	);
	const queueArn = Attributes.QueueArn;

	console.log("Subscribe SQS to SNS");
	const { SubscriptionArn } = await sns.send(
		new SubscribeCommand({
			TopicArn: topicArn,
			Protocol: "sqs",
			Endpoint: queueArn,
		}),
	);

	await sns.send(
		new SetSubscriptionAttributesCommand({
			SubscriptionArn,
			AttributeName: "RawMessageDelivery",
			AttributeValue: "true",
		}),
	);

	return { topicArn, queueUrl };
};

module.exports = {
	startLocalStack,
	bootstrap,
};
