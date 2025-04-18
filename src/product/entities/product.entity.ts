import { Class } from "src/class/entities/class.entity";
import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Grade } from "src/grade/entities/grade.entity";
import { Column, Entity, ManyToOne } from "typeorm";

@Entity()
export class Product extends BaseWithCreatedBy{
    @Column()
    title: string

    @Column()
    description: string

    @Column()
    content: string

    @Column()
    origin: string

    @Column()
    model: string

    @Column()
    trademark: string

    @Column()
    code: string

    @Column('text', { array: true })
    images: string[];

    @ManyToOne(() => Grade, grade => grade.products, { nullable: true, onDelete: 'SET NULL' })
    grade: Grade;

    @ManyToOne(() => Class, classEntity => classEntity.products, { nullable: true, onDelete: 'SET NULL' })
    class: Class;

    // @ManyToOne(() => Subject, subject => subject.products)
    // subject: Subject;

    // @ManyToMany(() => Category, category => category.products)
    // @JoinTable()
    // categories: Category[];
}
