import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from "typeorm";

@Entity()
export class Contact extends BaseWithCreatedBy{
    @Column()
    name: string

    @Column()
    phone: string

    @Column()
    address: string

    @Column()
    messages: string

    @OneToOne(() => User, (user) => user.address, { onDelete: 'CASCADE' })
    @JoinColumn()  // Chỉ định JoinColumn để tạo khóa ngoại
    user: User; 
}
