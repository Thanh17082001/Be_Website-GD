import { Category } from "src/categories/entities/category.entity";
import { Class } from "src/classes/entities/class.entity";
import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Product } from "src/products/entities/product.entity";
import { Subject } from "src/subjects/entities/subject.entity";
import { TypeParent } from "src/type-parents/entities/type-parent.entity";
import { TypeProduct } from "src/type-products/entities/type-product.entity";
import { Column, Entity, JoinTable, ManyToMany, OneToMany } from "typeorm";

@Entity()
export class Grade extends BaseWithCreatedBy {
    @Column()
    name: string

    @ManyToMany(() => Product, (product) => product.grades)
    @JoinTable()
    products: Product[];

    @ManyToMany(() => Subject, (subject) => subject.grades)
    subjects: Subject[];

    @OneToMany(() => Class, (cls) => cls.grade)
    classes: Class[]

    @ManyToMany(() => TypeProduct, (typeProduct) => typeProduct.grades)
    @JoinTable()
    typeProducts: TypeProduct[];

    @ManyToMany(() => Category, (category) => category.grades)
    categories: Category[];

    @ManyToMany(() => TypeParent, typeParent => typeParent.grades)
    typeParents: TypeParent[];
}