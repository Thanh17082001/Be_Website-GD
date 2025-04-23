
import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Grade } from "src/grade/entities/grade.entity";
import { Product } from "src/product/entities/product.entity";
import { Subject } from "src/subjects/entities/subject.entity";
import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany } from "typeorm";

@Entity()
export class Class extends BaseWithCreatedBy {
    @Column()
    name: string

    @ManyToOne(() => Grade, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'gradeId' })
    grade?: Grade;

    // @Column({ nullable: true })
    // gradeId?: number;

    @ManyToMany(() => Product, product => product.classes)
    @JoinTable()
    products: Product[];

    @ManyToMany(() => Subject, subject => subject.classes)
    @JoinTable()
    subjects: Subject[];
}
