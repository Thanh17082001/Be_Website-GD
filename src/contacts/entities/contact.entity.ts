import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from "typeorm";

@Entity()
export class Contact extends BaseWithCreatedBy {
    @Column()
    name: string

    @Column()
    phone: string

    @Column()
    address: string

    @Column()
    messages: string

    @Column({ default: 'example@gmail.com' })
    email: string

    @ManyToOne(() => User, (user) => user.contacts, { onDelete: 'CASCADE' })
    @JoinColumn() // Có thể thêm hoặc bỏ tùy bạn muốn rõ cột foreign key
    user: User;
}
