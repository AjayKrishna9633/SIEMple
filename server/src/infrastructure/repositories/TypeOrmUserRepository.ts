import {Repository} from 'typeorm';
import {AppDataSource} from '../database/data-source';
import {User} from '../../domain/entities/User';
import { UserRepository} from '../../domain/repositories/UserRepository';
import { UserEntity } from '../database/entities/User';

export  class TypeOrmUserRepository implements UserRepository{
    private repo :Repository<UserEntity>;

    constructor(){
        this.repo= AppDataSource.getRepository(UserEntity)
    }
    async findByEmail(email:string):Promise<User|null>{
        const row = await this.repo.findOneBy({email});
        return row ? this.toDomain(row):null;
    }

    async findById(id:string):Promise<User | null>{
        const row = await this.repo.findOneBy({id});
        return row ? this.toDomain(row):null;
    }

    async save(user:User):Promise<void>{
        const entity = await this.repo.create({
            id: user.getId(),
            email: user.getEmail(),
            passwordHash: user.getPasswordHash(),
            username: user.getUsername(),
            role: user.getRole(),
            isActive: user.getIsActive(),
            lastLoginAt: user.getLastLoginAt(),


        })
          await this.repo.save(entity);
    }

    private toDomain(row:UserEntity):User {
    return new User({
           id:row.id, email:row.email, passwordHash:row.passwordHash, username:row.username,
      role:row.role, isActive:row.isActive, lastLoginAt:row.lastLoginAt, createdAt:row.createdAt
    })
}

}


