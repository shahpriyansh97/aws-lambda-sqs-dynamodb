import { SQS } from '@aws-sdk/client-sqs';
import { faker } from '@faker-js/faker';
import { v4 as uuidv4 } from 'uuid';
import splitArray from 'split-array';

const sqs = new SQS();

export const lambdaHandler = async (event) => {
    const queueUrl = process.env.SQS_QUEUE_URL;

    const users = [];
    let errorUsers = 0;
    for (let i = 0; i < 100; i++) {
        const user = {
            id: faker.string.uuid(),
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            email: faker.internet.email(),
            phone: faker.phone.number(),
            address: {
                street: faker.location.streetAddress(),
                city: faker.location.city(),
                state: faker.location.state(),
                zipCode: faker.location.zipCode(),
                country: faker.location.country()
            },
            createdAt: faker.date.past().toISOString(),
        };

        // Add the year attribute based on the index
        if ((i + 1) % 3 === 0) {
            user.year = Math.floor(Math.random() * 21) + 2001; // Random year between 2001 and 2021
        } else {
            user.year = Math.floor(Math.random() * 2001); // Random year between 0 and 2000
        }

        if(user.year>2000)
            errorUsers += 1

        users.push(user);
    }

    const splittedArray = splitArray(users, 10);

    const sendPromises = splittedArray.map(arr => {
        const params = {
            QueueUrl: queueUrl,
            Entries: arr.map(message => ({
                Id: uuidv4(),
                MessageBody: JSON.stringify(message)
            }))
        };
        return sqs.sendMessageBatch(params);
    });

    try {
        await Promise.all(sendPromises);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Successfully sent 100 user records to SQS',errorUsers })
        };
    } catch (error) {
        console.error('Error sending messages to SQS:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error sending messages to SQS', error: error.message })
        };
    }
};