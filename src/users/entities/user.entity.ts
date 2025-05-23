import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import {Contact} from "src/contacts/entities/contact.entity"
import { Role } from "src/role/role.enum";
import { Column, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export class User extends BaseWithCreatedBy {

    @Column()
    fullName: string;
    @Column()
    username: string;
    @Column()
    email: string;
    @Column()
    password: string;
    @Column()
    isAdmin: boolean;
    @Column({ default: 'khách hàng', enum:Role })
    role: string;
    @Column({ default: 'default-user.png' })
    images: string;

    @OneToMany(() => Contact, (contact) => contact.user, { cascade: true })
    contacts: Contact[];
}
