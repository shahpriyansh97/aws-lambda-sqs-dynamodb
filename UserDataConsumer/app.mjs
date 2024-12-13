import AWS from "aws-sdk";

const sqs = new AWS.SQS();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Define the DynamoDB table name
const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

export const lambdaHandler = async (event) => {
    console.log(JSON.stringify(event));
    const batchItemFailures = []
    const queueUrl = process.env.SQS_QUEUE_URL;
    const entries = [];
    const Records = event.Records;

    for (let index = 0; index < Records.length; index++) {
        const record = Records[index];

        try {
            const data = JSON.parse(record.body);
            // Assuming `year` is part of the record payload
            const year = data.year; // Make sure this attribute exists in your record


            // Check if year is greater than 2000
            if (year > 2000) {
                console.log(`Sending message ${record.messageId} to DLQ due to year > 2000.`);
                throw new Error(`Year ${year} is greater than 2000 for message ${record.messageId}`);
            }

            // Create a new record in DynamoDB for years <= 2000
            const newItem = {
                messageId: record.messageId,
                receiptHandle: record.receiptHandle,
                createdAt: new Date().toISOString(), // Store creation timestamp
                year: year // Include the year
            };

            // Store the record in DynamoDB
            await dynamoDB.put({
                TableName: DYNAMODB_TABLE_NAME,
                Item: newItem,
            }).promise();

            entries.push({
                Id: record.messageId,
                ReceiptHandle: record.receiptHandle,
            });
        } catch (error) {
            console.error(`Error processing message ${record.messageId}:`, error);
            batchItemFailures.push({
                itemIdentifier: record.messageId
            })
        }
    }

    // Only delete messages if processing was successful
    await sqs.deleteMessageBatch({
        Entries: entries,
        QueueUrl: queueUrl,
    });

    console.log(JSON.stringify(batchItemFailures, null, 2));
        return {
            batchItemFailures: batchItemFailures,
        }

};
