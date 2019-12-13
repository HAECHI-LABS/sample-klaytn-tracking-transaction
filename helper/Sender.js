const Caver = require('caver-js');

class Sender {

    constructor(privateKey, nodeEndpoint) {
        this.privateKey = privateKey;
        this.caver = new Caver(nodeEndpoint);
        this.account = this.caver.klay.accounts.privateKeyToAccount('0x' + privateKey);
    }

    async getNonce() {
        return await this.caver.klay.getTransactionCount(this.account.address, 'pending');
    }

    async send(nonce, gasPrice) {
        let rawTx = {
            nonce: nonce,
            gasPrice: gasPrice,
            gasLimit: '0x171000',
            from: this.account.address,
            to: this.account.address,
            value: '0x1',
            data: ''
        };

        const { rawTransaction } = await this.caver.klay.accounts.signTransaction(
          rawTx,
          this.privateKey,
        );

        return new Promise((resolve, reject) => {
            this.caver.klay.sendSignedTransaction(rawTransaction, async (error, txHash) => {
                if(error) {
                    console.log(error.message);
                } else {
                    const hash = await this.caver.utils.sha3(rawTransaction);
                    return resolve(hash);
                }
            });
        });
    }
}
module.exports = { Sender };
