FROM public.ecr.aws/lambda/nodejs:20

COPY package.json ./

RUN npm install

COPY app.mjs ./

CMD ["app.lambdaHandler"]