export type SNSActions = "Publish" | "PublishBatch";

export interface MessageAttributeValue {
	/**
	 * @public
	 * <p>Amazon SNS supports the following logical data types: String, String.Array, Number, and
	 *             Binary. For more information, see <a href="https://docs.aws.amazon.com/sns/latest/dg/SNSMessageAttributes.html#SNSMessageAttributes.DataTypes">Message
	 *                 Attribute Data Types</a>.</p>
	 */
	DataType: string | undefined;

	/**
	 * @public
	 * <p>Strings are Unicode with UTF8 binary encoding. For a list of code values, see <a href="https://en.wikipedia.org/wiki/ASCII#ASCII_printable_characters">ASCII Printable
	 *                 Characters</a>.</p>
	 */
	StringValue?: string;

	/**
	 * @public
	 * <p>Binary type attributes can store any binary data, for example, compressed data,
	 *             encrypted data, or images.</p>
	 */
	BinaryValue?: Uint8Array;
}

export interface PublishMessage {
	/**
	 * @public
	 * <p>The topic you want to publish to.</p>
	 *          <p>If you don't specify a value for the <code>TopicArn</code> parameter, you must specify
	 *             a value for the <code>PhoneNumber</code> or <code>TargetArn</code> parameters.</p>
	 */
	TopicArn?: string;

	/**
	 * @public
	 * <p>If you don't specify a value for the <code>TargetArn</code> parameter, you must
	 *             specify a value for the <code>PhoneNumber</code> or <code>TopicArn</code>
	 *             parameters.</p>
	 */
	TargetArn?: string;

	/**
	 * @public
	 * <p>The phone number to which you want to deliver an SMS message. Use E.164 format.</p>
	 *          <p>If you don't specify a value for the <code>PhoneNumber</code> parameter, you must
	 *             specify a value for the <code>TargetArn</code> or <code>TopicArn</code>
	 *             parameters.</p>
	 */
	PhoneNumber?: string;

	/**
	 * @public
	 * <p>The message you want to send.</p>
	 *          <p>If you are publishing to a topic and you want to send the same message to all
	 *             transport protocols, include the text of the message as a String value. If you want to
	 *             send different messages for each transport protocol, set the value of the
	 *                 <code>MessageStructure</code> parameter to <code>json</code> and use a JSON object
	 *             for the <code>Message</code> parameter.
	 *         </p>
	 *          <p></p>
	 *          <p>Constraints:</p>
	 *          <ul>
	 *             <li>
	 *                <p>With the exception of SMS, messages must be UTF-8 encoded strings and at most
	 *                     256 KB in size (262,144 bytes, not 262,144 characters).</p>
	 *             </li>
	 *             <li>
	 *                <p>For SMS, each message can contain up to 140 characters. This character limit
	 *                     depends on the encoding schema. For example, an SMS message can contain 160 GSM
	 *                     characters, 140 ASCII characters, or 70 UCS-2 characters.</p>
	 *                <p>If you publish a message that exceeds this size limit, Amazon SNS sends the message
	 *                     as multiple messages, each fitting within the size limit. Messages aren't
	 *                     truncated mid-word but are cut off at whole-word boundaries.</p>
	 *                <p>The total size limit for a single SMS <code>Publish</code> action is 1,600
	 *                     characters.</p>
	 *             </li>
	 *          </ul>
	 *          <p>JSON-specific constraints:</p>
	 *          <ul>
	 *             <li>
	 *                <p>Keys in the JSON object that correspond to supported transport protocols must
	 *                     have simple JSON string values.</p>
	 *             </li>
	 *             <li>
	 *                <p>The values will be parsed (unescaped) before they are used in outgoing
	 *                     messages.</p>
	 *             </li>
	 *             <li>
	 *                <p>Outbound notifications are JSON encoded (meaning that the characters will be
	 *                     reescaped for sending).</p>
	 *             </li>
	 *             <li>
	 *                <p>Values have a minimum length of 0 (the empty string, "", is allowed).</p>
	 *             </li>
	 *             <li>
	 *                <p>Values have a maximum length bounded by the overall message size (so,
	 *                     including multiple protocols may limit message sizes).</p>
	 *             </li>
	 *             <li>
	 *                <p>Non-string values will cause the key to be ignored.</p>
	 *             </li>
	 *             <li>
	 *                <p>Keys that do not correspond to supported transport protocols are
	 *                     ignored.</p>
	 *             </li>
	 *             <li>
	 *                <p>Duplicate keys are not allowed.</p>
	 *             </li>
	 *             <li>
	 *                <p>Failure to parse or validate any key or value in the message will cause the
	 *                         <code>Publish</code> call to return an error (no partial delivery).</p>
	 *             </li>
	 *          </ul>
	 */
	Message: string | undefined;

	/**
	 * @public
	 * <p>Optional parameter to be used as the "Subject" line when the message is delivered to
	 *             email endpoints. This field will also be included, if present, in the standard JSON
	 *             messages delivered to other endpoints.</p>
	 *          <p>Constraints: Subjects must be ASCII text that begins with a letter, number, or
	 *             punctuation mark; must not include line breaks or control characters; and must be less
	 *             than 100 characters long.</p>
	 */
	Subject?: string;

	/**
	 * @public
	 * <p>Set <code>MessageStructure</code> to <code>json</code> if you want to send a different
	 *             message for each protocol. For example, using one publish action, you can send a short
	 *             message to your SMS subscribers and a longer message to your email subscribers. If you
	 *             set <code>MessageStructure</code> to <code>json</code>, the value of the
	 *                 <code>Message</code> parameter must: </p>
	 *          <ul>
	 *             <li>
	 *                <p>be a syntactically valid JSON object; and</p>
	 *             </li>
	 *             <li>
	 *                <p>contain at least a top-level JSON key of "default" with a value that is a
	 *                     string.</p>
	 *             </li>
	 *          </ul>
	 *          <p>You can define other top-level keys that define the message you want to send to a
	 *             specific transport protocol (e.g., "http").</p>
	 *          <p>Valid value: <code>json</code>
	 *          </p>
	 */
	MessageStructure?: string;

	/**
	 * @public
	 * <p>Message attributes for Publish action.</p>
	 */
	MessageAttributes?: Record<string, MessageAttributeValue>;

	/**
	 * @public
	 * <p>This parameter applies only to FIFO (first-in-first-out) topics. The
	 *                 <code>MessageDeduplicationId</code> can contain up to 128 alphanumeric characters
	 *                 <code>(a-z, A-Z, 0-9)</code> and punctuation
	 *                 <code>(!"#$%&'()*+,-./:;<=>?@[\]^_`\{|\}~)</code>.</p>
	 *          <p>Every message must have a unique <code>MessageDeduplicationId</code>, which is a token
	 *             used for deduplication of sent messages. If a message with a particular
	 *                 <code>MessageDeduplicationId</code> is sent successfully, any message sent with the
	 *             same <code>MessageDeduplicationId</code> during the 5-minute deduplication interval is
	 *             treated as a duplicate. </p>
	 *          <p>If the topic has <code>ContentBasedDeduplication</code> set, the system generates a
	 *                 <code>MessageDeduplicationId</code> based on the contents of the message. Your
	 *                 <code>MessageDeduplicationId</code> overrides the generated one.</p>
	 */
	MessageDeduplicationId?: string;

	/**
	 * @public
	 * <p>This parameter applies only to FIFO (first-in-first-out) topics. The
	 *                 <code>MessageGroupId</code> can contain up to 128 alphanumeric characters
	 *                 <code>(a-z, A-Z, 0-9)</code> and punctuation
	 *                 <code>(!"#$%&'()*+,-./:;<=>?@[\]^_`\{|\}~)</code>.</p>
	 *          <p>The <code>MessageGroupId</code> is a tag that specifies that a message belongs to a
	 *             specific message group. Messages that belong to the same message group are processed in
	 *             a FIFO manner (however, messages in different message groups might be processed out of
	 *             order). Every message must include a <code>MessageGroupId</code>.</p>
	 */
	MessageGroupId?: string;
}

export interface PublishResponse {
	/**
	 * @public
	 * <p>Unique identifier assigned to the published message.</p>
	 *          <p>Length Constraint: Maximum 100 characters</p>
	 */
	MessageId?: string;

	/**
	 * @public
	 * <p>This response element applies only to FIFO (first-in-first-out) topics. </p>
	 *          <p>The sequence number is a large, non-consecutive number that Amazon SNS assigns to each
	 *             message. The length of <code>SequenceNumber</code> is 128 bits.
	 *                 <code>SequenceNumber</code> continues to increase for each
	 *                 <code>MessageGroupId</code>.</p>
	 */
	SequenceNumber?: string;
}

export interface PublishBatchRequestEntry {
	/**
	 * @public
	 * <p>An identifier for the message in this batch.</p>
	 *          <note>
	 *             <p>The <code>Ids</code> of a batch request must be unique within a request. </p>
	 *             <p>This identifier can have up to 80 characters. The following characters are
	 *                 accepted: alphanumeric characters, hyphens(-), and underscores (_). </p>
	 *          </note>
	 */
	Id: string;

	/**
	 * @public
	 * <p>The body of the message.</p>
	 */
	Message: string;

	/**
	 * @public
	 * <p>The subject of the batch message.</p>
	 */
	Subject?: string;

	/**
	 * @public
	 * <p>Set <code>MessageStructure</code> to <code>json</code> if you want to send a different
	 *             message for each protocol. For example, using one publish action, you can send a short
	 *             message to your SMS subscribers and a longer message to your email subscribers. If you
	 *             set <code>MessageStructure</code> to <code>json</code>, the value of the
	 *                 <code>Message</code> parameter must: </p>
	 *          <ul>
	 *             <li>
	 *                <p>be a syntactically valid JSON object; and</p>
	 *             </li>
	 *             <li>
	 *                <p>contain at least a top-level JSON key of "default" with a value that is a
	 *                     string.</p>
	 *             </li>
	 *          </ul>
	 *          <p>You can define other top-level keys that define the message you want to send to a
	 *             specific transport protocol (e.g. http). </p>
	 */
	MessageStructure?: string;

	/**
	 * @public
	 * <p>Each message attribute consists of a <code>Name</code>, <code>Type</code>, and
	 *                 <code>Value</code>. For more information, see <a href="https://docs.aws.amazon.com/sns/latest/dg/sns-message-attributes.html">Amazon SNS message attributes</a> in
	 *             the Amazon SNS Developer Guide.</p>
	 */
	MessageAttributes?: Record<string, MessageAttributeValue>;

	/**
	 * @public
	 * <p>This parameter applies only to FIFO (first-in-first-out) topics.</p>
	 *          <p>The token used for deduplication of messages within a 5-minute minimum deduplication
	 *             interval. If a message with a particular <code>MessageDeduplicationId</code> is sent
	 *             successfully, subsequent messages with the same <code>MessageDeduplicationId</code> are
	 *             accepted successfully but aren't delivered.</p>
	 *          <ul>
	 *             <li>
	 *                <p>Every message must have a unique <code>MessageDeduplicationId</code>.</p>
	 *                <ul>
	 *                   <li>
	 *                      <p>You may provide a <code>MessageDeduplicationId</code>
	 *                             explicitly.</p>
	 *                   </li>
	 *                   <li>
	 *                      <p>If you aren't able to provide a <code>MessageDeduplicationId</code>
	 *                             and you enable <code>ContentBasedDeduplication</code> for your topic,
	 *                             Amazon SNS uses a SHA-256 hash to generate the
	 *                                 <code>MessageDeduplicationId</code> using the body of the message
	 *                             (but not the attributes of the message).</p>
	 *                   </li>
	 *                   <li>
	 *                      <p>If you don't provide a <code>MessageDeduplicationId</code> and the
	 *                             topic doesn't have <code>ContentBasedDeduplication</code> set, the
	 *                             action fails with an error.</p>
	 *                   </li>
	 *                   <li>
	 *                      <p>If the topic has a <code>ContentBasedDeduplication</code> set, your
	 *                                 <code>MessageDeduplicationId</code> overrides the generated one.
	 *                         </p>
	 *                   </li>
	 *                </ul>
	 *             </li>
	 *             <li>
	 *                <p>When <code>ContentBasedDeduplication</code> is in effect, messages with
	 *                     identical content sent within the deduplication interval are treated as
	 *                     duplicates and only one copy of the message is delivered.</p>
	 *             </li>
	 *             <li>
	 *                <p>If you send one message with <code>ContentBasedDeduplication</code> enabled,
	 *                     and then another message with a <code>MessageDeduplicationId</code> that is the
	 *                     same as the one generated for the first <code>MessageDeduplicationId</code>, the
	 *                     two messages are treated as duplicates and only one copy of the message is
	 *                     delivered. </p>
	 *             </li>
	 *          </ul>
	 *          <note>
	 *             <p>The <code>MessageDeduplicationId</code> is available to the consumer of the
	 *                 message (this can be useful for troubleshooting delivery issues).</p>
	 *             <p>If a message is sent successfully but the acknowledgement is lost and the message
	 *                 is resent with the same <code>MessageDeduplicationId</code> after the deduplication
	 *                 interval, Amazon SNS can't detect duplicate messages. </p>
	 *             <p>Amazon SNS continues to keep track of the message deduplication ID even after the
	 *                 message is received and deleted. </p>
	 *          </note>
	 *          <p>The length of <code>MessageDeduplicationId</code> is 128 characters.</p>
	 *          <p>
	 *             <code>MessageDeduplicationId</code> can contain alphanumeric characters <code>(a-z,
	 *                 A-Z, 0-9)</code> and punctuation
	 *                 <code>(!"#$%&'()*+,-./:;<=>?@[\]^_`\{|\}~)</code>.</p>
	 */
	MessageDeduplicationId?: string;

	/**
	 * @public
	 * <p>This parameter applies only to FIFO (first-in-first-out) topics.</p>
	 *          <p>The tag that specifies that a message belongs to a specific message group. Messages
	 *             that belong to the same message group are processed in a FIFO manner (however, messages
	 *             in different message groups might be processed out of order). To interleave multiple
	 *             ordered streams within a single topic, use <code>MessageGroupId</code> values (for
	 *             example, session data for multiple users). In this scenario, multiple consumers can
	 *             process the topic, but the session data of each user is processed in a FIFO fashion. </p>
	 *          <p>You must associate a non-empty <code>MessageGroupId</code> with a message. If you
	 *             don't provide a <code>MessageGroupId</code>, the action fails. </p>
	 *          <p>The length of <code>MessageGroupId</code> is 128 characters.</p>
	 *          <p>
	 *             <code>MessageGroupId</code> can contain alphanumeric characters <code>(a-z, A-Z,
	 *                 0-9)</code> and punctuation
	 *                 <code>(!"#$%&'()*+,-./:;<=>?@[\]^_`\{|\}~)</code>.</p>
	 *          <important>
	 *             <p>
	 *                <code>MessageGroupId</code> is required for FIFO topics. You can't use it for
	 *                 standard topics. </p>
	 *          </important>
	 */
	MessageGroupId?: string;
}

export interface PublishBatchMessage {
	/**
	 * @public
	 * <p>The Amazon resource name (ARN) of the topic you want to batch publish to.</p>
	 */
	TopicArn: string | undefined;

	/**
	 * @public
	 * <p>A list of <code>PublishBatch</code> request entries to be sent to the SNS
	 *             topic.</p>
	 */
	PublishBatchRequestEntries: PublishBatchRequestEntry[] | undefined;
}

export interface PublishBatchResultEntry {
	/**
	 * @public
	 * <p>The <code>Id</code> of an entry in a batch request.</p>
	 */
	Id?: string;

	/**
	 * @public
	 * <p>An identifier for the message.</p>
	 */
	MessageId?: string;

	/**
	 * @public
	 * <p>This parameter applies only to FIFO (first-in-first-out) topics.</p>
	 *          <p>The large, non-consecutive number that Amazon SNS assigns to each message.</p>
	 *          <p>The length of <code>SequenceNumber</code> is 128 bits. <code>SequenceNumber</code>
	 *             continues to increase for a particular <code>MessageGroupId</code>.</p>
	 */
	SequenceNumber?: string;
}

export interface BatchResultErrorEntry {
	/**
	 * @public
	 * <p>The <code>Id</code> of an entry in a batch request</p>
	 */
	Id: string | undefined;

	/**
	 * @public
	 * <p>An error code representing why the action failed on this entry.</p>
	 */
	Code: string | undefined;

	/**
	 * @public
	 * <p>A message explaining why the action failed on this entry.</p>
	 */
	Message?: string;

	/**
	 * @public
	 * <p>Specifies whether the error happened due to the caller of the batch API action.</p>
	 */
	SenderFault: boolean | undefined;
}


export interface PublishBatchResponse {
	/**
	 * @public
	 * <p>A list of successful <code>PublishBatch</code> responses.</p>
	 */
	Successful?: PublishBatchResultEntry[];

	/**
	 * @public
	 * <p>A list of failed <code>PublishBatch</code> responses. </p>
	 */
	Failed?: BatchResultErrorEntry[];
}