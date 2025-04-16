import { BaseEntity } from "src/common/entities/base.entity";
import { Grade } from "src/grade/entities/grade.entity";
import { Column, JoinColumn, ManyToOne } from "typeorm";

export class Class extends BaseEntity{
    @Column()
    name: string
    @Column()
    suffixes: string;
    @ManyToOne(() => Grade, (grade) => grade, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn()
    grade?: Grade
}
