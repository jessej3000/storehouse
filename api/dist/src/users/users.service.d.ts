import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAllForUserStakeAndWard(userId: number): Promise<{
        stake: {
            id: number;
            name: string;
        };
        ward: {
            stake_id: number;
            id: number;
            name: string;
        };
        email: string;
        firstname: string;
        lastname: string;
        gender: string;
        address: string;
        contact: string;
        stake_id: number;
        ward_id: number;
        id: number;
        role: string;
        active: boolean;
    }[]>;
    private assertSameStakeAndWard;
    update(requesterId: number, targetId: number, dto: UpdateUserDto): Promise<{
        stake: {
            id: number;
            name: string;
        };
        ward: {
            stake_id: number;
            id: number;
            name: string;
        };
        email: string;
        firstname: string;
        lastname: string;
        gender: string;
        address: string;
        contact: string;
        stake_id: number;
        ward_id: number;
        id: number;
        role: string;
        active: boolean;
    }>;
    remove(requesterId: number, targetId: number): Promise<void>;
}
