import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

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
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForUserStakeAndWard(userId: number) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    return this.prisma.user.findMany({
      where: { stake_id: user.stake_id, ward_id: user.ward_id },
      select: USER_SELECT,
      orderBy: { firstname: 'asc' },
    });
  }

  private async assertSameStakeAndWard(requesterId: number, targetId: number) {
    const requester = await this.prisma.user.findUniqueOrThrow({ where: { id: requesterId } });
    const target = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!target) {
      throw new NotFoundException(`User ${targetId} not found`);
    }
    if (target.stake_id !== requester.stake_id || target.ward_id !== requester.ward_id) {
      throw new ForbiddenException('You can only manage members in your own stake and ward.');
    }
    return { requester, target };
  }

  async update(requesterId: number, targetId: number, dto: UpdateUserDto) {
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

  async remove(requesterId: number, targetId: number) {
    const { requester, target } = await this.assertSameStakeAndWard(requesterId, targetId);

    if (target.id === requester.id) {
      throw new ConflictException('You cannot delete your own account.');
    }

    try {
      await this.prisma.user.delete({ where: { id: targetId } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw new ConflictException('Cannot delete a member who has existing donations.');
      }
      throw err;
    }
  }
}
