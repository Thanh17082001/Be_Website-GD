import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Product } from "src/product/entities/product.entity";
import { Column, Entity, OneToMany } from "typeorm";

@Entity()
export class Grade extends BaseWithCreatedBy{
    @Column()
    name: string

    @OneToMany(() => Product, product => product.grade)
    products: Product[];
}
