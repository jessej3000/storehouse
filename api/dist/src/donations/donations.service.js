"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const DONATION_INCLUDE = {
    stake: true,
    ward: true,
    category: true,
    user: {
        select: { id: true, email: true, firstname: true, lastname: true },
    },
};
let DonationsService = class DonationsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, dto) {
        const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
        return this.prisma.donation.create({
            data: {
                name: dto.name,
                count: dto.count,
                expiration: new Date(dto.expiration),
                category_id: dto.category_id,
                user_id: user.id,
                stake_id: user.stake_id,
                ward_id: user.ward_id,
            },
            include: DONATION_INCLUDE,
        });
    }
    findAll() {
        return this.prisma.donation.findMany({
            include: DONATION_INCLUDE,
            orderBy: { createdAt: 'desc' },
        });
    }
    async findAllForUserStakeAndWard(userId) {
        const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
        return this.prisma.donation.findMany({
            where: { stake_id: user.stake_id, ward_id: user.ward_id },
            include: DONATION_INCLUDE,
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const donation = await this.prisma.donation.findUnique({
            where: { id },
            include: DONATION_INCLUDE,
        });
        if (!donation) {
            throw new common_1.NotFoundException(`Donation ${id} not found`);
        }
        return donation;
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.donation.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.count !== undefined && { count: dto.count }),
                ...(dto.expiration !== undefined && { expiration: new Date(dto.expiration) }),
                ...(dto.category_id !== undefined && { category_id: dto.category_id }),
                ...(dto.status !== undefined && { status: dto.status }),
            },
            include: DONATION_INCLUDE,
        });
    }
    async remove(id) {
        await this.findOne(id);
        await this.prisma.donation.delete({ where: { id } });
    }
};
exports.DonationsService = DonationsService;
exports.DonationsService = DonationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DonationsService);
//# sourceMappingURL=donations.service.js.map