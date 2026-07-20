import { PrismaService } from '../prisma/prisma.service';
export declare class OrgController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getStakes(): import("@prisma/client").Prisma.PrismaPromise<{
        id: number;
        name: string;
    }[]>;
    getWards(stakeId?: string): import("@prisma/client").Prisma.PrismaPromise<{
        stake_id: number;
        id: number;
        name: string;
    }[]>;
    getCategories(): import("@prisma/client").Prisma.PrismaPromise<{
        id: number;
        name: string;
    }[]>;
}
