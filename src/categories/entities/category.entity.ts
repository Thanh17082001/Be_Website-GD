import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Product } from "src/product/entities/product.entity";
import { Column, Entity, ManyToMany } from "typeorm";

@Entity()
export class Category extends BaseWithCreatedBy{
  @Column()
  name: string;

  @ManyToMany(() => Product, product => product.categories)
  products: Product[];
}
