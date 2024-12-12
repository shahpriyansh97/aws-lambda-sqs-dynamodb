import {SQS} from '@aws-sdk/client-sqs'
import {faker} from '@faker-js/faker'
import {v4 as uuidv4} from 'uuid'
import splitArray from 'split-array'

const sqs = new SQS()

export const lambdaHandler = async (event) => {
    const queueUrl = process.env.SQS_QUEUE_URL;

    const users = []
    let errorUsers = 0

    for (let i = 0; i < 100; i++) {
        const user = {
            id: faker.string.uuid(),
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            email: faker.internet.email(),
            phone: faker.phone.number(),
            address:{
                street: faker.address.streetAddress(),
                city: faker.address.city(),
                state: faker.address.state(),
                zipCode: faker.address.zipCode(),
                country: faker.address.country()
            },
            createdAt: faker.date.past().toISOString()
        }
        if((i+1)%3 ===0)
        {
            user.year = Math.floor(Math.random() * 21)+2001;
            errorUsers +=1
        }
        else {
            user.year = Math.floor(Math.random() * 2001);
        }
        users.push(user)
    }
    const splittedArray = splitArray(users,10)

    const sendPromises = splittedArray.map(arr=>{
        const params = {
            QueueUrl: queueUrl,
            Entries: arr.map(message=>({
                Id: uuidv4(),
                MessageBody: JSON.stringify(message)
            }))
        }
        return sqs.sendMessageBatch(params)
    })

    try {
        await Promise.all(sendPromises);
        return {
            statusCode: 200,
            body: JSON.stringify({message:'Succesfully sent 100 user records to SQS',errorUsers})
        }
    }
    catch (error) {
        console.error('Error sending Message to SQS:',error);
        return {
            statusCode: 500,
            body: JSON.stringify({message:'Error sending message to SQS',error:error.message})
        }
    }
}