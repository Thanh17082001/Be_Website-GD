import { Category } from "src/categories/entities/category.entity";
import { Class } from "src/class/entities/class.entity";
import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Product } from "src/product/entities/product.entity";
import { Subject } from "src/subjects/entities/subject.entity";
import { TypeProduct } from "src/type-products/entities/type-product.entity";
import { Column, Entity, JoinTable, ManyToMany, OneToMany } from "typeorm";

@Entity()
export class Grade extends BaseWithCreatedBy{
    @Column()
    name: string

    @OneToMany(() => Product, product => product.grade)
    products: Product[];

    // Một cấp có nhiều môn học
    @OneToMany(() => Subject, (subject) => subject.grade)
    subjects: Subject[];

    @OneToMany(() => Class, (cls) => cls.grade)
    classes: Class[]

    @ManyToMany(() => TypeProduct, (typeProduct) => typeProduct.grades)
    @JoinTable()
    typeProducts: TypeProduct[];

    @ManyToMany(() => Category, (category) => category.grades)
    categories: Category[];
}