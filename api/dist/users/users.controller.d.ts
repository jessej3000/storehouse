import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(req: any): Promise<{
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
    update(req: any, id: number, dto: UpdateUserDto): Promise<{
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
    remove(req: any, id: number): Promise<void>;
}
