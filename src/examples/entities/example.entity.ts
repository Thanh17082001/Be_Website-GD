import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity, Index } from "typeorm";

@Entity()
@Index("idx_example_name_gin", ["name"])
export class Example extends BaseEntity {
    @Column({ type: 'varchar', length: 255 })
    name: string;
}
