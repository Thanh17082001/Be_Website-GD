import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import {Contact} from "src/contacts/entities/contact.entity"
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
    @Column()
    role: string;

    @OneToOne(() => Contact, (contact) => contact.user, { cascade: true })
    address: Contact;
}
