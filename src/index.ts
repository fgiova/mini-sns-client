import {Pool} from "undici";
import {Signer, SignerOptions} from "@fgiova/aws-signature";

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
		this.pool = new Pool(this.topicSettings.endpoint, undiciOptions);
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
}