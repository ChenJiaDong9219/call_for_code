/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context } from 'fabric-contract-api';
import { ChaincodeStub, ClientIdentity } from 'fabric-shim';
import { RequirementContract } from '.';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import winston = require('winston');

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

class TestContext implements Context {
    public stub: sinon.SinonStubbedInstance<ChaincodeStub> = sinon.createStubInstance(ChaincodeStub);
    public clientIdentity: sinon.SinonStubbedInstance<ClientIdentity> = sinon.createStubInstance(ClientIdentity);
    public logging = {
        getLogger: sinon.stub().returns(sinon.createStubInstance(winston.createLogger().constructor)),
        setLevel: sinon.stub(),
     };
}

describe('RequirementContract', () => {

    let contract: RequirementContract;
    let ctx: TestContext;

    beforeEach(() => {
        contract = new RequirementContract();
        ctx = new TestContext();
        ctx.stub.getState.withArgs('1001').resolves(Buffer.from('{"value":"requirement 1001 value"}'));
        ctx.stub.getState.withArgs('1002').resolves(Buffer.from('{"value":"requirement 1002 value"}'));
    });

    describe('#requirementExists', () => {

        it('should return true for a requirement', async () => {
            await contract.requirementExists(ctx, '1001').should.eventually.be.true;
        });

        it('should return false for a requirement that does not exist', async () => {
            await contract.requirementExists(ctx, '1003').should.eventually.be.false;
        });

    });

    describe('#createRequirement', () => {

        it('should create a requirement', async () => {
            await contract.createRequirement(ctx, '1003', 'requirement 1003 value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1003', Buffer.from('{"value":"requirement 1003 value"}'));
        });

        it('should throw an error for a requirement that already exists', async () => {
            await contract.createRequirement(ctx, '1001', 'myvalue').should.be.rejectedWith(/The requirement 1001 already exists/);
        });

    });

    describe('#readRequirement', () => {

        it('should return a requirement', async () => {
            await contract.readRequirement(ctx, '1001').should.eventually.deep.equal({ value: 'requirement 1001 value' });
        });

        it('should throw an error for a requirement that does not exist', async () => {
            await contract.readRequirement(ctx, '1003').should.be.rejectedWith(/The requirement 1003 does not exist/);
        });

    });

    describe('#updateRequirement', () => {

        it('should update a requirement', async () => {
            await contract.updateRequirement(ctx, '1001', 'requirement 1001 new value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1001', Buffer.from('{"value":"requirement 1001 new value"}'));
        });

        it('should throw an error for a requirement that does not exist', async () => {
            await contract.updateRequirement(ctx, '1003', 'requirement 1003 new value').should.be.rejectedWith(/The requirement 1003 does not exist/);
        });

    });

    describe('#deleteRequirement', () => {

        it('should delete a requirement', async () => {
            await contract.deleteRequirement(ctx, '1001');
            ctx.stub.deleteState.should.have.been.calledOnceWithExactly('1001');
        });

        it('should throw an error for a requirement that does not exist', async () => {
            await contract.deleteRequirement(ctx, '1003').should.be.rejectedWith(/The requirement 1003 does not exist/);
        });

    });

});
