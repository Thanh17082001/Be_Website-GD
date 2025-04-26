import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Grade } from "src/grades/entities/grade.entity";
import { Product } from "src/products/entities/product.entity";
import { Column, Entity, ManyToMany, OneToMany } from "typeorm";

@Entity()
export class TypeProduct extends BaseWithCreatedBy{
    @Column()
    name: string
    
    @Column()
    images: string;

    @OneToMany(() => Product, product => product.typeProduct)
    products: Product[];

    @ManyToMany(() => Grade, (grade) => grade.typeProducts)
    grades: Grade[];
}
