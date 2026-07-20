import { DonationsService } from './donations.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { UpdateDonationDto } from './dto/update-donation.dto';
export declare class DonationsController {
    private readonly donationsService;
    constructor(donationsService: DonationsService);
    create(req: any, dto: CreateDonationDto): Promise<{
        user: {
            email: string;
            firstname: string;
            lastname: string;
            id: number;
        };
        stake: {
            id: number;
            name: string;
        };
        ward: {
            stake_id: number;
            id: number;
            name: string;
        };
        category: {
            id: number;
            name: string;
        };
    } & {
        stake_id: number;
        ward_id: number;
        id: number;
        name: string;
        count: number;
        expiration: Date;
        category_id: number;
        status: string;
        createdAt: Date;
        user_id: number;
    }>;
    findAll(req: any, scope?: string): Promise<({
        user: {
            email: string;
            firstname: string;
            lastname: string;
            id: number;
        };
        stake: {
            id: number;
            name: string;
        };
        ward: {
            stake_id: number;
            id: number;
            name: string;
        };
        category: {
            id: number;
            name: string;
        };
    } & {
        stake_id: number;
        ward_id: number;
        id: number;
        name: string;
        count: number;
        expiration: Date;
        category_id: number;
        status: string;
        createdAt: Date;
        user_id: number;
    })[]>;
    findOne(id: number): Promise<{
        user: {
            email: string;
            firstname: string;
            lastname: string;
            id: number;
        };
        stake: {
            id: number;
            name: string;
        };
        ward: {
            stake_id: number;
            id: number;
            name: string;
        };
        category: {
            id: number;
            name: string;
        };
    } & {
        stake_id: number;
        ward_id: number;
        id: number;
        name: string;
        count: number;
        expiration: Date;
        category_id: number;
        status: string;
        createdAt: Date;
        user_id: number;
    }>;
    update(id: number, dto: UpdateDonationDto): Promise<{
        user: {
            email: string;
            firstname: string;
            lastname: string;
            id: number;
        };
        stake: {
            id: number;
            name: string;
        };
        ward: {
            stake_id: number;
            id: number;
            name: string;
        };
        category: {
            id: number;
            name: string;
        };
    } & {
        stake_id: number;
        ward_id: number;
        id: number;
        name: string;
        count: number;
        expiration: Date;
        category_id: number;
        status: string;
        createdAt: Date;
        user_id: number;
    }>;
    remove(id: number): Promise<void>;
}
