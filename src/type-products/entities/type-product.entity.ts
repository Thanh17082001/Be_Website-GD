import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Grade } from "src/grade/entities/grade.entity";
import { Product } from "src/product/entities/product.entity";
import { Column, Entity, ManyToMany, OneToMany } from "typeorm";

@Entity()
export class TypeProduct extends BaseWithCreatedBy{
    @Column()
    name: string
    
    @Column()
    image: string;

    @OneToMany(() => Product, product => product.typeProduct)
    products: Product[];

    @ManyToMany(() => Grade, (grade) => grade.typeProducts)
    grades: Grade[];
}
