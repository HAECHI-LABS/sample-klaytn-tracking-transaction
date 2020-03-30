require('dotenv').config()
const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const {TransactionHelper} = require('./helper/TransactionHelper');
const {HenesisCaver} = require('../henesis-sdk-js/packages/henesis-sdk-js');
const {Transaction, Status} = require('./types/index');

const transactions = {};

const {PRIVATE_KEY, TN_ENDPOINT} = process.env;
const TIMEOUT = 10000;
const CONFIRMATION = 0;
const GAS_PRICE = 25000000000;

const caver = new HenesisCaver(TN_ENDPOINT);
const transactionHelper = new TransactionHelper(caver, PRIVATE_KEY);

app.use(express.static(path.join(__dirname, 'build')));

app.get('/api/tx', function (req, res) {
  res.json(Object.entries(transactions).map(item => {
    return {
      transactionHash: item[0],
      status: item[1].status,
      nonce: parseInt(item[1].nonce, 16),
      data: item[1]
    }
  }));
});

app.post('/api/tx', async function (req, res) {
  const nonce = await transactionHelper.getNonce();
  const signedTransaction = await transactionHelper.getDefaultSignedTransaction(nonce, GAS_PRICE);
  const hash = await caver.utils.sha3(signedTransaction);

  console.log(`send transaction ${hash} with nonce ${nonce}`);

  caver.klay.sendSignedTransaction(signedTransaction, {
    timeout: TIMEOUT, // default is 30 * 1000
    confirmation: CONFIRMATION // default is 6
  });

  const transaction = new Transaction(
    transactionHash,
    nonce,
    GAS_PRICE
  );

  res.json(transaction);
});

app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

async function trackTx() {
  const subscription = await caver.klay.subscribe('transaction', {
    subscriptionId: 'your-subscription-id',
    ackTimeout: 30 * 1000 // default is 10 * 1000 (ms)
  });

  subscription.on('message', async (message) => {
    console.log(`now transaction status is: ${message.data.type}`);
    switch (message.data.type) {
      case 'pending' :
        transactions[message.data.result.transactionHash] = {status: Status.pending};
        break;
      case 'receipt' :
        console.log('message.data.result', message.data.result);
        transactions[message.data.result.transactionHash] = {...message.data.result, status: Status.receipt}
        break;
      case 'confirmation' :
        console.log('message.data.result', message.data.result);
        transactions[message.data.result.transactionHash] = {...message.data.result, status: Status.confirmation}
        break;
    }
    message.ack();
  });

  subscription.on('error', async (error) => {
    console.log('err', error)
  });
}

async function main() {
  trackTx();
  app.listen(3000);
}

main();
