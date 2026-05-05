import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  findAll() {
    return this.roleRepo.find();
  }

  async findByName(name: string) {
    return await this.roleRepo.findOne({ where: { name } });
  }

  async create(data: Partial<Role>) {
    const existing = await this.roleRepo.findOne({ where: { name: data.name } });
    if (existing) throw new Error('Role already exists');
    const role = this.roleRepo.create(data);
    return this.roleRepo.save(role);
  }

  async update(id: number, data: Partial<Role>) {
    const role = await this.roleRepo.findOneBy({ id });
    if (!role) throw new NotFoundException('Role not found');
    return this.roleRepo.save({ ...role, ...data });
  }

  async delete(id: number) {
    const result = await this.roleRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async findById(id: number) {
    return this.roleRepo.findOneBy({ id });
  }
}
