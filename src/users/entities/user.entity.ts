import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn() 
    id: number;

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
}
