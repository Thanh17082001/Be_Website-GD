import { Category } from "src/categories/entities/category.entity";
import { Class } from "src/classes/entities/class.entity";
import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Grade } from "src/grades/entities/grade.entity";
import { Subject } from "src/subjects/entities/subject.entity";
import { TypeParent } from "src/type-parents/entities/type-parent.entity";
import { TypeProduct } from "src/type-products/entities/type-product.entity";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from "typeorm";

@Entity()
export class Product extends BaseWithCreatedBy {
    @Column()
    title: string

    @Column()
    description: string

    @Column()
    content: string

    @Column({ default: '' })
    apply: string

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

    @ManyToMany(() => Grade, (grade) => grade.products)
    grades: Grade[];

    @ManyToMany(() => Class, classEntity => classEntity.products)
    @JoinTable()
    classes: Class[];

    @ManyToMany(() => Subject, subject => subject.products)
    @JoinTable()
    subjects: Subject[];

    @ManyToOne(() => TypeProduct, typeProduct => typeProduct.products, { nullable: true, onDelete: 'SET NULL' })
    typeProduct: TypeProduct;


    @ManyToMany(() => Category, category => category.products)
    @JoinTable()
    categories: Category[];

    @ManyToOne(() => TypeParent, typeParent => typeParent.products, { nullable: true, onDelete: 'SET NULL' })
    typeParent: TypeParent;
}
