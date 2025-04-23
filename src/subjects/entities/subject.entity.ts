import { Class } from "src/class/entities/class.entity";
import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Grade } from "src/grade/entities/grade.entity";
import { Product } from "src/product/entities/product.entity";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany } from "typeorm";

@Entity()
export class Subject extends BaseWithCreatedBy {
    @Column()
    name: string

    // Một môn học thuộc một khối
    @ManyToOne(() => Grade, (grade) => grade.subjects, { onDelete: 'SET NULL' })
    grade: Grade;

    @ManyToMany(() => Product, product => product.subjects)
    products: Product[];

    // 👉 Một môn học có thể dạy ở nhiều lớp
    @ManyToMany(() => Class, classEntity => classEntity.subjects)
    classes: Class[];

}
