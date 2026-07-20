import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class OrgController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('stakes')
  getStakes() {
    return this.prisma.stake.findMany({ orderBy: { name: 'asc' } });
  }

  @Get('wards')
  getWards(@Query('stakeId') stakeId?: string) {
    const parsedStakeId = stakeId ? Number(stakeId) : undefined;
    return this.prisma.ward.findMany({
      where: parsedStakeId ? { stake_id: parsedStakeId } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  @Get('categories')
  getCategories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }
}
