package com.fimatchplus.backend.backtest.repository;

import com.fimatchplus.backend.backtest.domain.ExecutionLog;
import com.fimatchplus.backend.backtest.domain.ActionType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.List;

/**
 * ExecutionLog JDBC 배치 삽입 Repository
 */
@Slf4j
@Repository
@RequiredArgsConstructor
public class ExecutionLogJdbcRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final String INSERT_SQL = """
        INSERT INTO execution_logs 
        (backtest_id, log_date, action_type, category, trigger_value, threshold_value, reason, portfolio_value, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;

    /**
     * ExecutionLog 배치 삽입
     */
    public int batchInsert(List<ExecutionLog> logs) {
        if (logs.isEmpty()) {
            return 0;
        }

        try {
            int[] batchResult = jdbcTemplate.batchUpdate(INSERT_SQL, new BatchPreparedStatementSetter() {
                @Override
                public void setValues(PreparedStatement ps, int i) throws SQLException {
                    ExecutionLog log = logs.get(i);
                    ps.setLong(1, log.getBacktestId());
                    ps.setTimestamp(2, Timestamp.valueOf(log.getLogDate()));
                    ps.setString(3, log.getActionType().name());
                    ps.setString(4, log.getCategory());
                    ps.setDouble(5, log.getTriggerValue() != null ? log.getTriggerValue() : 0.0);
                    ps.setDouble(6, log.getThresholdValue() != null ? log.getThresholdValue() : 0.0);
                    ps.setString(7, log.getReason());
                    ps.setDouble(8, log.getPortfolioValue() != null ? log.getPortfolioValue() : 0.0);
                    ps.setTimestamp(9, Timestamp.valueOf(log.getCreatedAt()));
                }

                @Override
                public int getBatchSize() {
                    return logs.size();
                }
            });

            return batchResult.length;
        } catch (Exception e) {
            log.error("Failed to batch insert execution logs", e);
            throw new RuntimeException("Failed to batch insert execution logs", e);
        }
    }

    /**
     * 최적화된 배치 삽입 (큰 배치를 작은 단위로 분할)
     */
    public int optimizedBatchInsert(List<ExecutionLog> logs) {
        if (logs.isEmpty()) {
            return 0;
        }

        int batchSize = 1000;
        int totalInserted = 0;

        for (int i = 0; i < logs.size(); i += batchSize) {
            List<ExecutionLog> batch = logs.subList(i, Math.min(i + batchSize, logs.size()));
            totalInserted += batchInsert(batch);
        }

        return totalInserted;
    }

    /**
     * 백테스트 ID로 ExecutionLog 조회
     */
    public List<ExecutionLog> findByBacktestId(Long backtestId) {
        String SELECT_SQL = """
            SELECT id, backtest_id, log_date, action_type, category, 
                   trigger_value, threshold_value, reason, portfolio_value, created_at
            FROM execution_logs 
            WHERE backtest_id = ? 
            ORDER BY log_date ASC
            """;

        try {
            return jdbcTemplate.query(SELECT_SQL, (rs, rowNum) -> {
                return ExecutionLog.builder()
                    .backtestId(rs.getLong("backtest_id"))
                    .logDate(rs.getTimestamp("log_date").toLocalDateTime())
                    .actionType(ActionType.valueOf(rs.getString("action_type")))
                    .category(rs.getString("category"))
                    .triggerValue(rs.getDouble("trigger_value"))
                    .thresholdValue(rs.getDouble("threshold_value"))
                    .reason(rs.getString("reason"))
                    .portfolioValue(rs.getDouble("portfolio_value"))
                    .build();
            }, backtestId);
        } catch (Exception e) {
            log.error("Failed to find execution logs by backtestId: {}", backtestId, e);
            return List.of();
        }
    }
}
