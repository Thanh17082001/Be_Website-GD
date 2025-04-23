import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Grade } from "src/grade/entities/grade.entity";
import { Product } from "src/product/entities/product.entity";
import { Column, Entity, JoinTable, ManyToMany } from "typeorm";

@Entity()
export class Category extends BaseWithCreatedBy{
  @Column()
  name: string;

  @ManyToMany(() => Product, product => product.categories)
  products: Product[];

  @ManyToMany(() => Grade, (grade) => grade.categories)
  @JoinTable() 
  grades: Grade[];
}
