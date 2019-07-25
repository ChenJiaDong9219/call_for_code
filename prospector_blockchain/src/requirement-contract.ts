/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { Requirement } from './requirement';

@Info({title: 'RequirementContract', description: 'My Smart Contract' })
export class RequirementContract extends Contract {

    @Transaction(false)
    @Returns('boolean')
    public async requirementExists(ctx: Context, requirementId: string): Promise<boolean> {
        const buffer = await ctx.stub.getState(requirementId);
        return (!!buffer && buffer.length > 0);
    }

    @Transaction()
    public async createRequirement(ctx: Context, requirementId: string, value: string): Promise<void> {
        const exists = await this.requirementExists(ctx, requirementId);
        if (exists) {
            throw new Error(`The requirement ${requirementId} already exists`);
        }
        const requirement = new Requirement();
        requirement.value = value;
        const buffer = Buffer.from(JSON.stringify(requirement));
        await ctx.stub.putState(requirementId, buffer);
    }

    @Transaction(false)
    @Returns('Requirement')
    public async readRequirement(ctx: Context, requirementId: string): Promise<Requirement> {
        const exists = await this.requirementExists(ctx, requirementId);
        if (!exists) {
            throw new Error(`The requirement ${requirementId} does not exist`);
        }
        const buffer = await ctx.stub.getState(requirementId);
        const requirement = JSON.parse(buffer.toString()) as Requirement;
        return requirement;
    }

    @Transaction()
    public async updateRequirement(ctx: Context, requirementId: string, newValue: string): Promise<void> {
        const exists = await this.requirementExists(ctx, requirementId);
        if (!exists) {
            throw new Error(`The requirement ${requirementId} does not exist`);
        }
        const requirement = new Requirement();
        requirement.value = newValue;
        const buffer = Buffer.from(JSON.stringify(requirement));
        await ctx.stub.putState(requirementId, buffer);
    }

    @Transaction()
    public async deleteRequirement(ctx: Context, requirementId: string): Promise<void> {
        const exists = await this.requirementExists(ctx, requirementId);
        if (!exists) {
            throw new Error(`The requirement ${requirementId} does not exist`);
        }
        await ctx.stub.deleteState(requirementId);
    }

}
