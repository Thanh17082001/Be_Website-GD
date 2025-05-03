import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Grade } from "src/grades/entities/grade.entity";
import { Product } from "src/products/entities/product.entity";
import { TypeParent } from "src/type-parents/entities/type-parent.entity";
import { Column, Entity, ManyToMany, ManyToOne, OneToMany } from "typeorm";

@Entity()
export class TypeProduct extends BaseWithCreatedBy {
    @Column()
    name: string

    @Column()
    images: string;

    @OneToMany(() => Product, product => product.typeProduct)
    products: Product[];

    @ManyToMany(() => Grade, (grade) => grade.typeProducts)
    grades: Grade[];

    @ManyToOne(() => TypeParent, typeParent => typeParent.typeProducts, { nullable: true, onDelete: 'SET NULL' })
    typeParent: TypeParent;
}