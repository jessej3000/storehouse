import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { UpdateDonationDto } from './dto/update-donation.dto';

const DONATION_INCLUDE = {
  stake: true,
  ward: true,
  category: true,
  user: {
    select: { id: true, email: true, firstname: true, lastname: true },
  },
} as const;

@Injectable()
export class DonationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateDonationDto) {
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

  async findAllForUserStakeAndWard(userId: number) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    return this.prisma.donation.findMany({
      where: { stake_id: user.stake_id, ward_id: user.ward_id },
      include: DONATION_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const donation = await this.prisma.donation.findUnique({
      where: { id },
      include: DONATION_INCLUDE,
    });
    if (!donation) {
      throw new NotFoundException(`Donation ${id} not found`);
    }
    return donation;
  }

  async update(id: number, dto: UpdateDonationDto) {
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

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.donation.delete({ where: { id } });
  }
}
