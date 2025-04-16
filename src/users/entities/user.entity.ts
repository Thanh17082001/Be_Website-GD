import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";


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

    @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
    createdBy?: User
}
