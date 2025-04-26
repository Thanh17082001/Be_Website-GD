import { Class } from "src/classes/entities/class.entity";
import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Grade } from "src/grades/entities/grade.entity";
import { Product } from "src/products/entities/product.entity";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany } from "typeorm";

@Entity()
export class Subject extends BaseWithCreatedBy {
    @Column()
    name: string

    @ManyToMany(() => Grade, (grade) => grade.subjects)
    @JoinTable() 
    grades: Grade[];

    @ManyToMany(() => Product, product => product.subjects)
    products: Product[];

    // 👉 Một môn học có thể dạy ở nhiều lớp
    @ManyToMany(() => Class, classEntity => classEntity.subjects)
    classes: Class[];

}
