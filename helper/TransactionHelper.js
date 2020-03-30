class TransactionHelper {

    constructor(caver, privateKey) {
        this.privateKey = privateKey;
        this.caver = caver;
        this.account = this.caver.klay.accounts.privateKeyToAccount('0x' + privateKey);
    }

    async getNonce() {
        return await this.caver.klay.getTransactionCount(this.account.address, 'pending');
    }

    getDefaultSignedTransaction(nonce, gasPrice) {
        const rawTx = {
            nonce: nonce,
            gasPrice: gasPrice,
            gasLimit: '0x171000',
            from: this.account.address,
            to: this.account.address,
            value: '0x0',
            data: ''
        };

        return this._sign(rawTx);
    }

    async _sign(rawTx) {
        const { rawTransaction } = await this.caver.klay.accounts.signTransaction(
          rawTx,
          this.privateKey,
        );

        return rawTransaction;
    }

}
module.exports = { TransactionHelper: TransactionHelper };
