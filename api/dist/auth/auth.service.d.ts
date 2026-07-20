import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    validateUser(email: string, password: string): Promise<{
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
    login(email: string, password: string): Promise<{
        access_token: string;
        user: {
            id: number;
            email: string;
            role: string;
        };
    }>;
    signup(dto: SignupDto): Promise<{
        message: string;
    }>;
    private buildAuthResponse;
}
