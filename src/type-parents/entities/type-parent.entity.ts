import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Grade } from "src/grades/entities/grade.entity";
import { Product } from "src/products/entities/product.entity";
import { TypeProduct } from "src/type-products/entities/type-product.entity";
import { Column, Entity, JoinTable, ManyToMany, OneToMany } from "typeorm";

@Entity()
export class TypeParent extends BaseWithCreatedBy {
    @Column()
    name: string

    @OneToMany(() => TypeProduct, typeProduct => typeProduct.typeParent)
    typeProducts: TypeProduct[];

    @OneToMany(() => Product, product => product.typeParent)
    products: Product[];

    @ManyToMany(() => Grade, grade => grade.typeParents)
    @JoinTable()
    grades: Grade[];
}
