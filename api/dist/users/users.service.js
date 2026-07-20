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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const USER_SELECT = {
    id: true,
    email: true,
    role: true,
    active: true,
    firstname: true,
    lastname: true,
    gender: true,
    address: true,
    contact: true,
    stake_id: true,
    ward_id: true,
    stake: true,
    ward: true,
};
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAllForUserStakeAndWard(userId) {
        const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
        return this.prisma.user.findMany({
            where: { stake_id: user.stake_id, ward_id: user.ward_id },
            select: USER_SELECT,
            orderBy: { firstname: 'asc' },
        });
    }
    async assertSameStakeAndWard(requesterId, targetId) {
        const requester = await this.prisma.user.findUniqueOrThrow({ where: { id: requesterId } });
        const target = await this.prisma.user.findUnique({ where: { id: targetId } });
        if (!target) {
            throw new common_1.NotFoundException(`User ${targetId} not found`);
        }
        if (target.stake_id !== requester.stake_id || target.ward_id !== requester.ward_id) {
            throw new common_1.ForbiddenException('You can only manage members in your own stake and ward.');
        }
        return { requester, target };
    }
    async update(requesterId, targetId, dto) {
        await this.assertSameStakeAndWard(requesterId, targetId);
        return this.prisma.user.update({
            where: { id: targetId },
            data: {
                ...(dto.firstname !== undefined && { firstname: dto.firstname }),
                ...(dto.lastname !== undefined && { lastname: dto.lastname }),
                ...(dto.gender !== undefined && { gender: dto.gender }),
                ...(dto.address !== undefined && { address: dto.address }),
                ...(dto.contact !== undefined && { contact: dto.contact }),
                ...(dto.role !== undefined && { role: dto.role }),
                ...(dto.active !== undefined && { active: dto.active }),
            },
            select: USER_SELECT,
        });
    }
    async remove(requesterId, targetId) {
        const { requester, target } = await this.assertSameStakeAndWard(requesterId, targetId);
        if (target.id === requester.id) {
            throw new common_1.ConflictException('You cannot delete your own account.');
        }
        try {
            await this.prisma.user.delete({ where: { id: targetId } });
        }
        catch (err) {
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
                throw new common_1.ConflictException('Cannot delete a member who has existing donations.');
            }
            throw err;
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map