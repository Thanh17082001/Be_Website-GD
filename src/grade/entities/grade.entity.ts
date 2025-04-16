import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity, OneToMany } from "typeorm";

@Entity()
export class Grade extends BaseEntity{
    @Column()
    name: string

    // // Một khối có nhiều môn học
    // @OneToMany(() => Subject, (subject) => subject.grade)
    // subjects: Subject[];
}
